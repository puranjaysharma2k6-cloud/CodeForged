import type { Request, Response } from "express";
import { prisma } from "../db/db.js";


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
        const [contests, totalContests] = await prisma.$transaction([
        prisma.contest.findMany({
          where: { status: 'PAST' }, 
          orderBy: { startTime: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.contest.count({
          where: { status: 'PAST' }
        })
      ]);

        return res.status(200).json({
            data: contests,
            meta: { currentPage: page, totalPages: Math.ceil(totalContests / limit), totalContests }
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }

};

export async function getLatestContests(req : Request, res : Response){
 
  try{
  const contest = await prisma.contest.findMany({
    where : {
      status : 'UPCOMING', 
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


export async function getContestById(req: Request, res: Response): Promise<void> {
  const contestId  = req.params.id;
  try{const contest = await prisma.contest.findUnique({
      where: {
        id: contestId as string 
      },
      include : {
       problems : true,
      },
    
    });

  if (!contest) {
    res.status(404).json({ message: "Contest not found" });
    return;
  }

  res.status(200).json(contest);}
   catch(e){
    res.status(500).json({message : "cannot get contest internal server error"});
   }
}



export async function registerForContest(req: Request, res: Response): Promise<void> {

  const contestId = req.params.contestId as string ; 
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
    const isPastContest = contest.status=="PAST";
    const registrationMode = isPastContest ? 'VIRTUAL' : 'OFFICIAL';
    
     if(contest.status=="ONGOING" && endTime<now){
        res.status(400).json({error : "registration deadline exceeded"});
        return;
     }
    
    if (registrationMode === 'OFFICIAL') {
      const existingOfficial = await prisma.contestRegistration.findFirst({
        where: {
          userId,
          contestId,
          mode: 'OFFICIAL'
        }
      });
         
      if (existingOfficial) {
        res.status(400).json({ error: "You are already registered for this official live contest." });
        return;
      }
    }
    if (registrationMode === 'VIRTUAL'){
      const ongoingContestWindow= new Date(now.getTime()-contest.duration * 60 * 60 * 1000);
       const ongoingContest = await prisma.contestRegistration.findFirst({
        where: {
          userId,
          contestId,
          registeredAt : { gt : ongoingContestWindow},
          mode: 'VIRTUAL'
        } 
      });
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
        mode: registrationMode
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






