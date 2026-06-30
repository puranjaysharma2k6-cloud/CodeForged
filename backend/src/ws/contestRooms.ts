import { WebSocket } from "ws";

/**
 * Tracks open WebSocket connections grouped by contestId.
 *
 * When a client connects to the arena it registers itself here.
 * When a contest ends, closeContest() broadcasts CONTEST_ENDED to every
 * socket in that room and terminates the connections.
 *
 * This is a single-process in-memory map — fine for one server instance.
 * For multi-instance you'd need Redis to coordinate, but that's a
 * scale-up concern, not a day-one concern.
 */
export class ContestRoomManager {
  // contestId → Set of open sockets in that contest's arena
  private readonly rooms = new Map<string, Set<WebSocket>>();

  join(contestId: string, ws: WebSocket): void {
    if (!this.rooms.has(contestId)) {
      this.rooms.set(contestId, new Set());
    }
    this.rooms.get(contestId)!.add(ws);

    // Auto-clean on disconnect so the set doesn't accumulate dead sockets
    ws.on("close", () => this.leave(contestId, ws));
  }

  leave(contestId: string, ws: WebSocket): void {
    this.rooms.get(contestId)?.delete(ws);
  }

  /**
   * Broadcasts CONTEST_ENDED to all sockets in the room,
   * then closes every connection.
   * Called by the ContestEndScheduler callback.
   */
  closeContest(contestId: string): void {
    const sockets = this.rooms.get(contestId);
    if (!sockets || sockets.size === 0) return;

    const payload = JSON.stringify({
      type: "CONTEST_ENDED",
      contestId,
    });

    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
        ws.close(1000, "Contest ended");
      }
    }

    this.rooms.delete(contestId);
    console.log(
      `[contest-rooms] closed ${sockets.size} connection(s) for contest "${contestId}"`,
    );
  }

  roomSize(contestId: string): number {
    return this.rooms.get(contestId)?.size ?? 0;
  }
}

// Singleton — imported by both the WS server and the end-time callback
export const contestRooms = new ContestRoomManager();
