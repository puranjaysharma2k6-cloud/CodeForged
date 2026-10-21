import type { Request, Response } from "express";
import { prisma } from "../db/db.js";
import { ContestStatus, Mode, Verdict } from "../generated/prisma/enums.js";


export async function getprevContests(req:Request,res : Response) {
  const page = parseInt(String(req.query.page), 10) || 1;
  const limit = parseInt(String(req.query.limit), 10) || 10;
    
    // 2. Calculate offset
    const offset = (page - 1) * limit;
    const now = new Date();
  try {
    // this skip take thing is pagination
    // when a user queries past contests databse does not loads all of em
    // db loads only 10-20 then when user goes onto next page then only loaded
       const [contests, totalContests] = await Promise.all([
        prisma.contest.findMany({
          where: { status: ContestStatus.PAST },
          orderBy: { startTime: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.contest.count({
          where: { status: ContestStatus.PAST },
        }),
      ]);
          
        return res.status(200).json({
            data: contests,
            meta: { currentPage: page, totalPages: Math.ceil(totalContests / limit), totalContests }
        });
    } catch (error) {
      console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }

};

export async function getLatestContests(req : Request, res : Response){
 
  try{
  const contest = await prisma.contest.findMany({
    where: {
      status: {
        in: [ContestStatus.UPCOMING, ContestStatus.ONGOING],
      },
    },
    orderBy: { startTime: 'asc' }
  });
  
   res.status(200).json({
     data : contest,
   });
  }
  catch(e) {
     return res.status(500).json({e : "Try again ,internal server error"});
  }
}

export async function getContestArena(req: Request, res: Response): Promise<void> {
  const contestId = req.params.id as string;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  try {
  
  const contestData = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      
      problems : {
        where: { published: true },
        select : {
          id:true,
          title:true,
          statement:true,
          timeLimit:true,
          memoryLimit:true,
          submissions : true,
        }
      },
  
      participants: {
        where: { userId },
        orderBy: { registeredAt: "desc" },
        take: 1,
        select: {
          contestId: true,
          registeredAt: true,
          mode: true,
        },
      },
    },
  });

  const registration = contestData?.participants[0] ?? null;

    if (!contestData) {
      res.status(404).json({ message: "Contest not found." });
      return;
    }

    if (!registration) {
      res.status(403).json({ message: "Register for this contest before entering the arena." });
      return;
    }

    const now = new Date();
    const virtualEnd = new Date(
      registration.registeredAt.getTime() + contestData.duration * 60 * 1000,
    );
    const canEnterOfficial =
      registration.mode === Mode.OFFICIAL && contestData.status === ContestStatus.ONGOING;
    const canEnterVirtual =
      registration.mode === Mode.VIRTUAL &&
      contestData.status === ContestStatus.PAST &&
      now < virtualEnd;

    if (!canEnterOfficial && !canEnterVirtual) {
      res.status(403).json({ message: "This contest is not currently available to you." });
      return;
    }

    const { participants: _participants, ...contest } = contestData;
    res.status(200).json({ contest, registration });
  } catch (e) {
    res.status(500).json({ message: "Internal server error." });
  }
}

/** Returns the requesting user's registration for one contest, if any. */
export async function getContestRegistration(req: Request, res: Response): Promise<void> {
  const contestId = req.params.id as string;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  try {
    const registration = await prisma.contestRegistration.findFirst({
      where: { userId, contestId },
      orderBy: { registeredAt: "desc" },
      select: { contestId: true, registeredAt: true, mode: true },
    });

    res.status(200).json({ registration });
  } catch (error) {
    console.error("[contest-registration] error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/** Returns contest-scoped standings in the shape consumed by the live standings UI. */
export async function getContestLeaderboard(req: Request, res: Response): Promise<void> {
  const contestId = req.params.id as string;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  try {
    const [contest, registration] = await Promise.all([
      prisma.contest.findUnique({
        where: { id: contestId },
        select: { id: true, startTime: true },
      }),
      prisma.contestRegistration.findFirst({
        where: { contestId, userId },
        orderBy: { registeredAt: "desc" },
        select: { contestId: true },
      }),
    ]);

    if (!contest) {
      res.status(404).json({ message: "Contest not found." });
      return;
    }

    if (!registration) {
      res.status(403).json({ message: "Register for this contest before viewing standings." });
      return;
    }

    const submissions = await prisma.submission.findMany({
      where: { problem: { contestId } },
      orderBy: { createdAt: "asc" },
      select: {
        status: true,
        createdAt: true,
        problemId: true,
        user: { select: { id: true, username: true, name: true } },
      },
    });

    const entries = new Map<string, {
      userId: string;
      username: string;
      name: string | null;
      score: number;
      penalty: number;
      problemStats: Record<string, { problemId: string; solved: boolean; attempts: number; solvedAt?: number }>;
    }>();

    for (const submission of submissions) {
      const entry = entries.get(submission.user.id) ?? {
        userId: submission.user.id,
        username: submission.user.username,
        name: submission.user.name,
        score: 0,
        penalty: 0,
        problemStats: {},
      };
      const stat = entry.problemStats[submission.problemId] ?? {
        problemId: submission.problemId,
        solved: false,
        attempts: 0,
      };

      if (!stat.solved) {
        stat.attempts += 1;
        if (submission.status === Verdict.ACCEPTED) {
          stat.solved = true;
          stat.solvedAt = Math.max(
            0,
            Math.floor((submission.createdAt.getTime() - contest.startTime.getTime()) / 60_000),
          );
          entry.score += 1;
          entry.penalty += stat.solvedAt + (stat.attempts - 1) * 20;
        }
      }

      entry.problemStats[submission.problemId] = stat;
      entries.set(submission.user.id, entry);
    }

    const leaderboard = [...entries.values()]
      .sort((a, b) => b.score - a.score || a.penalty - b.penalty || a.username.localeCompare(b.username))
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    res.status(200).json({ leaderboard });
  } catch (error) {
    console.error("[contest-leaderboard] error:", error);
    res.status(500).json({ message: "Unable to load contest standings." });
  }
}

export async function registerForContest(req: Request, res: Response): Promise<void> {

  const contestId = req.params.id as string ; 
  const userId = req.user?.userId; 
  const now = new Date();

  if (!userId) {
    res.status(401).json({ message: "Invalid user. Check credentials." });
    return;
  }
  if (!contestId) {
    res.status(400).json({ error: "Contest ID is required in URL parameters." });
    return;
  }
  try {
  
    const contest = await prisma.contest.findUnique({
      where: { id: contestId as string },
      select: { startTime: true, duration: true, title: true ,status : true}
  });

    if (!contest) {
      res.status(404).json({ error: "Contest not found." });
      return;
    }

    const now = new Date();
    const endTime = new Date(contest.startTime.getTime() + 5 * 60 * 1000);
    const isPastContest = contest.status === ContestStatus.PAST;
    const registrationMode = isPastContest ? Mode.VIRTUAL : Mode.OFFICIAL;

    if (contest.status === ContestStatus.ONGOING && endTime < now) {
        res.status(400).json({error : "registration deadline exceeded"});
        return;
     }
    
    if (registrationMode === Mode.OFFICIAL) {
      const existingOfficial = await prisma.contestRegistration.findFirst({
        where: {
          userId,
          contestId,
          mode: Mode.OFFICIAL,
        }
      });
         
      if (existingOfficial) {
        res.status(400).json({ error: "You are already registered for this official live contest." });
        return;
      }
    }
    if (registrationMode === Mode.VIRTUAL) {
      const ongoingContestWindow = new Date(now.getTime() - contest.duration * 60 * 1000);
      const ongoingContest = await prisma.contestRegistration.findFirst({
        where: {
          userId,
          contestId,
          registeredAt: { gt: ongoingContestWindow },
          mode: Mode.VIRTUAL,
        }
      }); 
        console.log(ongoingContest);
   
       if(ongoingContest){
        
        res.status(400).json({error : "The contest is still ongoing"});
        return;
       }
      
      }
        
      // immediately enter the contest arena after loggin in 
     
    const registration = await prisma.contestRegistration.create({
      data: {
        userId,
        contestId,
        registeredAt: now,
        mode: registrationMode,
      },
    });

    res.status(201).json({
      message: registrationMode === 'VIRTUAL' 
        ? `Virtual participation started for "${contest.title}"!` 
        : "Successfully registered for the official live contest!",
      registration,
    });

  } catch (error) {
    console.error("Registration endpoint error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}



