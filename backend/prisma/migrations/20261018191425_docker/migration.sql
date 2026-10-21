/*
  Warnings:

  - You are about to drop the column `vjudgeId` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the `ProblemTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserTopicAnalysisCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserTopicStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProblemTag" DROP CONSTRAINT "ProblemTag_problemId_fkey";

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "vjudgeId";

-- DropTable
DROP TABLE "ProblemTag";

-- DropTable
DROP TABLE "UserTopicAnalysisCache";

-- DropTable
DROP TABLE "UserTopicStats";

-- CreateIndex
CREATE INDEX "ContestResult_contestId_mode_score_penalty_idx" ON "ContestResult"("contestId", "mode", "score" DESC, "penalty" ASC);
