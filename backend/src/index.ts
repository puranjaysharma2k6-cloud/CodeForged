import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createServer } from 'http';
import cors from 'cors';
import express from 'express';
import apiRoutes from './routes/index.js';
import { scheduleActiveContest } from './jobs/contestScheduler.js';
import { contestRooms } from './ws/contestRooms.js';
import { attachVerdictWebSocket } from './ws/verdictSockets.js';

// import { RedisStreamVerdictPublisher } from './verdicts/RedisStreamVerdictPublisher.js';

import { connectRedis, redisClient, redisReader } from './redis/redis.js';
import { seedCodeforcesProblems } from './utils/problemSeed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.resolve(projectRoot, '.env') });
dotenv.config({ path: path.resolve(projectRoot, '.env.local') });

const app = express();
const PORT = Number(process.env.PORT) || 8000;

const localFrontendOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === process.env.CLIENT_URL || localFrontendOrigin.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function start() {
  await connectRedis();
  const httpServer = createServer(app);

  attachVerdictWebSocket(httpServer, redisReader, redisClient);

  httpServer.listen(PORT,'0.0.0.0', () => {
    console.log(`[server] running on http://localhost:${PORT}`);
  });


  // Verdicts are written to Redis Streams, WebSocket server reads and forwards.
  // const publisher = new RedisStreamVerdictPublisher(redisClient);

  try {
    await seedCodeforcesProblems();
  } catch (error) {
    console.error('[startup] problem seeding failed:', error);
  }

  try {
    await scheduleActiveContest();
  } catch (error) {
    console.error('[startup] contest scheduler failed:', error);
  }
}

start();

export { contestRooms };
