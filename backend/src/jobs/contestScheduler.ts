import { prisma } from "../db/db.js";
import { contestRooms } from "../ws/contestRooms.js";

/**
 * Schedules the two status transitions for a single contest using
 * precise setTimeout calls — no polling, no cron, no lag.
 *
 *   UPCOMING  →  ONGOING  fires at exactly startTime
 *   ONGOING   →  PAST     fires at exactly startTime + duration minutes
 *
 * One contest at a time: calling scheduleContest() cancels any
 * previously scheduled timers before setting new ones.
 */

let startTimer: NodeJS.Timeout | null = null;
let endTimer: NodeJS.Timeout | null = null;

function clearTimers() {
  if (startTimer) { clearTimeout(startTimer); startTimer = null; }
  if (endTimer)   { clearTimeout(endTimer);   endTimer   = null; }
}

/**
 * Schedule both transitions for the given contest.
 * Safe to call at boot (picks up mid-contest correctly) and whenever
 * a new contest is created or updated.
 */
export function scheduleContest(contest: {
  id: string;
  startTime: Date;
  duration: number; // minutes
}): void {
  clearTimers();

  const now       = Date.now();
  const startMs   = contest.startTime.getTime();
  const endMs     = startMs + contest.duration * 60 * 1000;
  const msToStart = startMs - now;
  const msToEnd   = endMs   - now;

  // ── UPCOMING → ONGOING ──────────────────────────────────────────────
  if (msToStart > 0) {
    startTimer = setTimeout(async () => {
      await prisma.contest.update({
        where: { id: contest.id },
        data:  { status: "ONGOING" },
      });
      console.log(`[scheduler] contest "${contest.id}" is now ONGOING`);
    }, msToStart);

    console.log(
      `[scheduler] contest "${contest.id}" starts in ${Math.round(msToStart / 1000)}s`,
    );
  }

  // ── ONGOING → PAST ───────────────────────────────────────────────────
  if (msToEnd > 0) {
    endTimer = setTimeout(async () => {
      await prisma.contest.update({
        where: { id: contest.id },
        data:  { status: "PAST" },
      });
      console.log(`[scheduler] contest "${contest.id}" is now PAST`);

      // Close every arena WebSocket immediately
      contestRooms.closeContest(contest.id);
    }, msToEnd);

    console.log(
      `[scheduler] contest "${contest.id}" ends in ${Math.round(msToEnd / 1000)}s`,
    );
  }

  // Contest already past — nothing to schedule
  if (msToStart <= 0 && msToEnd <= 0) {
    console.log(`[scheduler] contest "${contest.id}" is already PAST, nothing to schedule`);
  }
}

/**
 * Called at server boot.
 * Finds the next relevant contest (UPCOMING or ONGOING) and schedules it.
 * If the server restarted mid-contest, the ONGOING status is corrected
 * and the end timer is set precisely.
 */
export async function scheduleActiveContest(): Promise<void> {
  const now = new Date();

  // Find any contest that isn't finished yet
  const contest = await prisma.contest.findFirst({
    where: { status: { in: ["UPCOMING", "ONGOING"] } },
    orderBy: { startTime: "asc" },
    select: { id: true, startTime: true, duration: true, status: true },
  });

  if (!contest) {
    console.log("[scheduler] no upcoming or ongoing contests found");
    return;
  }

  const endTime = new Date(contest.startTime.getTime() + contest.duration * 60 * 1000);

  // Server restarted while contest was supposed to be ONGOING
  if (contest.status === "UPCOMING" && contest.startTime <= now) {
    await prisma.contest.update({
      where: { id: contest.id },
      data:  { status: "ONGOING" },
    });
    console.log(`[scheduler] corrected stale UPCOMING → ONGOING for "${contest.id}"`);
  }

  // Server restarted after contest ended but status wasn't flipped
  if (endTime <= now) {
    await prisma.contest.update({
      where: { id: contest.id },
      data:  { status: "PAST" },
    });
    console.log(`[scheduler] corrected stale status → PAST for "${contest.id}"`);
    return;
  }

  scheduleContest(contest);
}
