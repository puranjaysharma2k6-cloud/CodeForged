/*
  Redis Streams vs pub/sub and why i upgraded to redis streams:
    Streams persist messages. A client that disconnects mid-judging
    reconnects with its last-seen stream entry ID and receives every
    missed verdict update — nothing is ever lost.
 
  Protocol (client  server, first message after connect):
    { type: "subscribe", submissionId: "<uuid>", lastId: "0" }
      "0"      read from the beginning (first connect or tab reopen)
      "<id>" +resume from a specific entry (reconnect recovery)
 
  Protocol (server  client, one message per stream entry):
    {
      type: "verdict",
      submissionId, verdict,
      executionTimeMs?, memoryUsedKb?,
      compileError?, runtimeError?,
      judgedAt, providerName,
      streamId     client stores this as lastId for reconnect
    }
    { type: "error", message }
 
  Stream key:  verdict:<submissionId>
  Cleanup:     stream auto-deleted 30s after terminal verdict as redis stream is not fire and forget like pubsubs
               the messages are still in memory and need to be deleted
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { RedisClientType } from 'redis';

const TERMINAL_VERDICTS = new Set([
  'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR', 'COMPILATION_ERROR', 'PRESENTATION_ERROR',
  'OUTPUT_LIMIT_EXCEEDED', 'SYSTEM_ERROR', 'INTERNAL_ERROR',
]);

// How long (ms) to block on XREAD before looping again (checks ws.readyState)
const BLOCK_MS = 5_000;

/**
  Attach the verdict WebSocket server to the existing HTTP server.
   Must be called after connectRedis() in index.ts.
 
  @param httpServer  The http.Server Express is already listening on
  @param reader      A dedicated redis client for blocking XREAD calls
                     (must not share with the write client)
  @param writer      The general-purpose redis client (for DEL)
 */
export function attachVerdictWebSocket(
  httpServer: Server,
  reader: RedisClientType,
  writer: RedisClientType,
): void {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/verdict' });

  wss.on('connection', (ws: WebSocket) => {
    const activeSubscriptions = new Set<string>();

    ws.on('message', (raw) => {
      let msg: { type?: string; submissionId?: string; lastId?: string };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      const submissionId = msg.submissionId;
      if (msg.type === 'subscribe' && submissionId) {
        if (activeSubscriptions.has(submissionId)) {
          ws.send(JSON.stringify({
            type: 'info',
            message: `Already subscribed to submission ${submissionId}`,
          }));
          return;
        }

        activeSubscriptions.add(submissionId);
        void readLoop(ws, reader, writer, submissionId, msg.lastId ?? '0', () => {
          activeSubscriptions.delete(submissionId);
        });
        return;
      }

      if (msg.type === 'unsubscribe' && submissionId) {
        activeSubscriptions.delete(submissionId);
        ws.send(JSON.stringify({ type: 'unsubscribed', submissionId }));
        return;
      }

      ws.send(JSON.stringify({
        type: 'error',
        message: 'Expected { type: "subscribe", submissionId: "...", lastId: "0" }',
      }));
    });

    ws.on('close', () => {
      activeSubscriptions.clear();
    });

    ws.on('error', (err) => {
      console.error('[verdict-ws] socket error:', err.message);
    });
  });

  console.log('[verdict-ws] attached at ws://.../ws/verdict');
}

async function readLoop(
  ws: WebSocket,
  reader: RedisClientType,
  writer: RedisClientType,
  submissionId: string,
  startId: string,
  onComplete?: () => void,
): Promise<void> {
  const streamKey = `verdict:${submissionId}`;
  let lastId = startId;

  try {
    while (ws.readyState === WebSocket.OPEN) {
      let result: Awaited<ReturnType<typeof reader.xRead>> = null;

      try {
        //   xRead(key, id, options?) — blocking read from one stream for avoiding race conditions and dirty writes
        result = await reader.xRead(
          { key: streamKey, id: lastId },
          { COUNT: 10, BLOCK: BLOCK_MS },
        );
      } catch (err: any) {
  
        if (err.message?.includes('ETIMEDOUT') || err.message?.includes('timed out')) {
          continue;
        }
        console.error('[verdict-ws] XREAD error:', err.message);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'Stream read failed' }));
        }
        break;
      }

      if (!result || result.length === 0) continue; 

      const messages = result[0].messages;

      for (const { id: entryId, message: fields } of messages) {
        lastId = entryId;

        if (ws.readyState !== WebSocket.OPEN) return;

        ws.send(JSON.stringify({
          type:            'verdict',
          submissionId:    fields.submissionId ?? submissionId,
          verdict:         fields.verdict,
          executionTimeMs: fields.executionTimeMs ? Number(fields.executionTimeMs) : undefined,
          memoryUsedKb:    fields.memoryUsedKb   ? Number(fields.memoryUsedKb)   : undefined,
          compileError:    fields.compileError   ?? undefined,
          runtimeError:    fields.runtimeError   ?? undefined,
          judgedAt:        fields.judgedAt,
          providerName:    fields.providerName,
          streamId:        entryId,
        }));

        if (fields.verdict && TERMINAL_VERDICTS.has(fields.verdict)) {
          // Clean up stream 30s after terminal verdict as streams unlike pub subs store the prev history
          // (late-connecting clients can still read the final state)
          await writer.expire(streamKey, 9000); // 15 mins
          
          return;
        }
      }
    }
  } finally {
    onComplete?.();
  }
}
