/*
  Warnings:

  - Added the required column `duration` to the `Contest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `ContestRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('UPCOMING', 'ONGOING', 'PAST');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('OFFICIAL', 'VIRTUAL');

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "status" "ContestStatus" NOT NULL DEFAULT 'UPCOMING';

-- AlterTable
ALTER TABLE "ContestRegistration" ADD COLUMN     "mode" "Mode" NOT NULL;
