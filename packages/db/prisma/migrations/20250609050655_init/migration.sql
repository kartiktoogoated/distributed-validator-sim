/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `averageLatency` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `correctVotes` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `publicKey` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `totalVotes` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `uptimePercent` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ValidatorLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ValidatorLog` table. All the data in the column will be lost.
  - You are about to drop the column `challengeExpiry` on the `ValidatorMeta` table. All the data in the column will be lost.
  - You are about to drop the column `lastVerifiedAt` on the `ValidatorMeta` table. All the data in the column will be lost.
  - You are about to drop the column `verificationChallenge` on the `ValidatorMeta` table. All the data in the column will be lost.
  - The primary key for the `Website` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `updatedAt` on the `Website` table. All the data in the column will be lost.
  - You are about to drop the `PaymentTransaction` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[wallet]` on the table `Validator` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[url]` on the table `Website` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Validator_publicKey_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Validator" DROP COLUMN "averageLatency",
DROP COLUMN "correctVotes",
DROP COLUMN "createdAt",
DROP COLUMN "isVerified",
DROP COLUMN "publicKey",
DROP COLUMN "totalVotes",
DROP COLUMN "updatedAt",
DROP COLUMN "uptimePercent",
DROP COLUMN "weight",
ADD COLUMN     "lastSeen" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ValidatorLog" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "location" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ValidatorMeta" DROP COLUMN "challengeExpiry",
DROP COLUMN "lastVerifiedAt",
DROP COLUMN "verificationChallenge",
ADD COLUMN     "averageLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "correctVotes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalVotes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "uptimePercent" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Website" DROP CONSTRAINT "Website_pkey",
DROP COLUMN "updatedAt",
ADD COLUMN     "paused" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Website_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Website_id_seq";

-- DropTable
DROP TABLE "PaymentTransaction";

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Validator_wallet_key" ON "Validator"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "Website_url_key" ON "Website"("url");
