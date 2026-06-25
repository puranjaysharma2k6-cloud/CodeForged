/*
  Warnings:

  - You are about to drop the column `changeAmount` on the `ContestResult` table. All the data in the column will be lost.
  - Added the required column `newRating` to the `ContestResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContestResult" DROP COLUMN "changeAmount",
ADD COLUMN     "newRating" INTEGER NOT NULL;
