/*
  Warnings:

  - A unique constraint covering the columns `[userId,contestId,mode]` on the table `ContestResult` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ContestResult_userId_contestId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ContestResult_userId_contestId_mode_key" ON "ContestResult"("userId", "contestId", "mode");
