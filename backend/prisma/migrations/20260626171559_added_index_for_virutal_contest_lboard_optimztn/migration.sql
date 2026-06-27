/*
  Warnings:

  - The primary key for the `ContestResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `ContestResult` table. All the data in the column will be lost.
  - You are about to drop the column `newRating` on the `ContestResult` table. All the data in the column will be lost.
  - You are about to drop the column `oldRating` on the `ContestResult` table. All the data in the column will be lost.
  - You are about to drop the column `rankAchieved` on the `ContestResult` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,contestId]` on the table `ContestResult` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `ContestResult` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `mode` to the `ContestResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ContestResult" DROP CONSTRAINT "ContestResult_contestId_fkey";

-- DropForeignKey
ALTER TABLE "ContestResult" DROP CONSTRAINT "ContestResult_userId_fkey";

-- DropIndex
DROP INDEX "ContestResult_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "ContestResult" DROP CONSTRAINT "ContestResult_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "newRating",
DROP COLUMN "oldRating",
DROP COLUMN "rankAchieved",
ADD COLUMN     "finalRank" INTEGER,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "mode" "Mode" NOT NULL,
ADD COLUMN     "penalty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "problemStats" JSONB,
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "ContestResult_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "ContestResult_contestId_mode_score_penalty_idx" ON "ContestResult"("contestId", "mode", "score" DESC, "penalty" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContestResult_userId_contestId_key" ON "ContestResult"("userId", "contestId");

-- AddForeignKey
ALTER TABLE "ContestResult" ADD CONSTRAINT "ContestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestResult" ADD CONSTRAINT "ContestResult_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
