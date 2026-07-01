import "dotenv/config";
import cors from "cors";
import express from "express";
import apiRoutes from "./routes/index.js";
import { scheduleActiveContest } from "./jobs/contestScheduler.js";
import { contestRooms } from "./ws/contestRooms.js";
import { buildJudgeService, buildSubmissionQueue } from "./judge-module/example/usage.js";
import { VerdictPublisher } from "./verdicts/VerdictPublisher.js";
import { setSubmissionQueue } from "./controllers/submission.controller.js";

const app = express();
const PORT = Number(process.env.PORT) || 8000;

app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function start() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // ── Judge blackbox ────────────────────────────────────────────────────
  // VerdictPublisher: updates DB on terminal verdict.
  // TODO: swap for RedisPubSubVerdictPublisher once pub/sub is wired,
  //       so WebSocket layer can forward live updates to the frontend.
  const publisher = new VerdictPublisher();
  const { judgeService, vjudgeProvider } = buildJudgeService(publisher);
  const submissionQueue = buildSubmissionQueue(judgeService, vjudgeProvider);

  // Inject queue into the submit controller
  setSubmissionQueue(submissionQueue);

  console.log(
    `[judge] vjudge pool ready — ${vjudgeProvider.getPoolStatus().total} account(s)`,
  );

  // ── Contest scheduler ────────────────────────────────────────────────
  // Schedules precise setTimeout for UPCOMING→ONGOING and ONGOING→PAST.
  // Also closes arena WebSockets when a contest ends.
  await scheduleActiveContest();
}

start();

export { contestRooms };
