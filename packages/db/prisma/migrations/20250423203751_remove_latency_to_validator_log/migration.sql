/*
  Warnings:

  - You are about to drop the column `latency` on the `ValidatorLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ValidatorLog" DROP COLUMN "latency";
