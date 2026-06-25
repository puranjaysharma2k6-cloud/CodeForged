-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "ContestResult" (
    "userId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "rankAchieved" INTEGER NOT NULL,
    "oldRating" INTEGER NOT NULL,
    "changeAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestResult_pkey" PRIMARY KEY ("userId","contestId")
);

-- AddForeignKey
ALTER TABLE "ContestResult" ADD CONSTRAINT "ContestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestResult" ADD CONSTRAINT "ContestResult_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
