

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
