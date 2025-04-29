/*
  Warnings:

  - Added the required column `latency` to the `ValidatorLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ValidatorLog" ADD COLUMN     "latency" INTEGER NOT NULL;
