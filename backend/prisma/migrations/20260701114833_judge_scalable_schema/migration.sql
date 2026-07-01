-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Verdict" ADD VALUE 'PENDING';
ALTER TYPE "Verdict" ADD VALUE 'PRESENTATION_ERROR';
ALTER TYPE "Verdict" ADD VALUE 'OUTPUT_LIMIT_EXCEEDED';
ALTER TYPE "Verdict" ADD VALUE 'SYSTEM_ERROR';

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "vjudgeId" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "testResults" JSONB,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "x";

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "problemId" TEXT NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestCase_problemId_idx" ON "TestCase"("problemId");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
