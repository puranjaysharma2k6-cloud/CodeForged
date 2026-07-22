/**
 * Shared Redis client using node-redis.
 *
 * Two separate clients are required:
 *   redisClient  — for writes (XADD, ZADD, DEL, general commands)
 *   redisReader  — for blocking reads (XREAD with BLOCK) — a client
 *                  doing a blocking command cannot issue other commands
 *                  on the same connection simultaneously.
 *
 * Both connect lazily on first use. Call connectRedis() at server boot.
 */

import { createClient, type RedisClientType } from 'redis';

const url = process.env.REDIS_URL;
if (!url) throw new Error('REDIS_URL is not set in .env');

export const redisClient: RedisClientType = createClient({ url }) as RedisClientType;
export const redisReader: RedisClientType = createClient({ url }) as RedisClientType;

redisClient.on('error', (err) => console.error('[redis] client error:', err.message));
redisReader.on('error', (err) => console.error('[redis] reader error:', err.message));

export async function connectRedis(): Promise<void> {
  await Promise.all([redisClient.connect(), redisReader.connect()]);
  console.log('[redis] connected');
}
