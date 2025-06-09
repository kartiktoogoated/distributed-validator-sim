/*
  Warnings:

  - You are about to drop the column `lastSeen` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `wallet` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `ValidatorLog` table. All the data in the column will be lost.
  - You are about to drop the column `averageLatency` on the `ValidatorMeta` table. All the data in the column will be lost.
  - You are about to drop the column `correctVotes` on the `ValidatorMeta` table. All the data in the column will be lost.
  - You are about to drop the column `totalVotes` on the `ValidatorMeta` table. All the data in the column will be lost.
  - You are about to drop the column `uptimePercent` on the `ValidatorMeta` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `ValidatorMeta` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Validator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ValidatorLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- DropIndex
DROP INDEX "Validator_wallet_key";

-- AlterTable
ALTER TABLE "Validator" DROP COLUMN "lastSeen",
DROP COLUMN "wallet",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastPaymentTimestamp" TIMESTAMP(3),
ADD COLUMN     "pendingPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicKey" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "location" SET DEFAULT 'unknown';

-- AlterTable
ALTER TABLE "ValidatorLog" DROP COLUMN "location",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "timestamp" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ValidatorMeta" DROP COLUMN "averageLatency",
DROP COLUMN "correctVotes",
DROP COLUMN "totalVotes",
DROP COLUMN "uptimePercent",
DROP COLUMN "weight",
ADD COLUMN     "challengeExpiry" TIMESTAMP(3),
ADD COLUMN     "lastVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "verificationChallenge" TEXT;

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" SERIAL NOT NULL,
    "validatorId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
