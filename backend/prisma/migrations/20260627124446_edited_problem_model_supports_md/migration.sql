/*
  Warnings:

  - You are about to drop the column `content` on the `Problem` table. All the data in the column will be lost.
  - Added the required column `statement` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Problem" DROP CONSTRAINT "Problem_contestId_fkey";

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "content",
ADD COLUMN     "memoryLimit" INTEGER NOT NULL DEFAULT 256,
ADD COLUMN     "statement" TEXT NOT NULL,
ADD COLUMN     "timeLimit" INTEGER NOT NULL DEFAULT 2000;

-- CreateIndex
CREATE INDEX "Problem_contestId_idx" ON "Problem"("contestId");

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
