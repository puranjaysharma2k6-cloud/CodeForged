import 'dotenv/config';
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

const app = express();
const PORT = Number(process.env.PORT) || 8000;

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }));
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


  await seedCodeforcesProblems();
  await scheduleActiveContest();
}

start();

export { contestRooms };
