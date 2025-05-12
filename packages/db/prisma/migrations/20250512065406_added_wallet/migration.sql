/*
  Warnings:

  - A unique constraint covering the columns `[wallet]` on the table `Validator` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lastSeen` to the `Validator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wallet` to the `Validator` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Validator" ADD COLUMN     "lastSeen" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "wallet" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Validator_wallet_key" ON "Validator"("wallet");
