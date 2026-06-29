/*
  Warnings:

  - The primary key for the `ContestRegistration` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "ContestRegistration" DROP CONSTRAINT "ContestRegistration_pkey",
ADD COLUMN     "attempt" SERIAL NOT NULL,
ADD CONSTRAINT "ContestRegistration_pkey" PRIMARY KEY ("userId", "contestId", "attempt");
