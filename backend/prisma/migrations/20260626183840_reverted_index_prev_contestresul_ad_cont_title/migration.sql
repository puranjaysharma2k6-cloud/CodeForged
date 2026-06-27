/*
  Warnings:

  - Added the required column `newRating` to the `ContestResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `ContestResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ContestResult_contestId_mode_score_penalty_idx";

-- AlterTable
ALTER TABLE "ContestResult" ADD COLUMN     "newRating" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "User_currentRating_idx" ON "User"("currentRating" DESC);
