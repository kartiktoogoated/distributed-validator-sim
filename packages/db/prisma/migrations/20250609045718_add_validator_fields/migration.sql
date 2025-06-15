/*
  Warnings:

  - The values [SUCCESS] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `PaymentTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `lastPaymentTimestamp` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `pendingPayment` on the `Validator` table. All the data in the column will be lost.
  - The primary key for the `Website` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `paused` on the `Website` table. All the data in the column will be lost.
  - The `id` column on the `Website` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[publicKey]` on the table `Validator` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `publicKey` on table `Validator` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `location` to the `ValidatorLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Website` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
ALTER TABLE "PaymentTransaction" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_validatorId_fkey";

-- DropIndex
DROP INDEX "Website_url_key";

-- AlterTable
ALTER TABLE "PaymentTransaction" ADD COLUMN     "error" TEXT,
ALTER COLUMN "signature" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Validator" DROP COLUMN "lastPaymentTimestamp",
DROP COLUMN "pendingPayment",
ADD COLUMN     "averageLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "correctVotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalVotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uptimePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "wallet" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
ALTER COLUMN "location" DROP DEFAULT,
ALTER COLUMN "publicKey" SET NOT NULL;

-- AlterTable
ALTER TABLE "ValidatorLog" ADD COLUMN     "location" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Website" DROP CONSTRAINT "Website_pkey",
DROP COLUMN "paused",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Website_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Validator_publicKey_key" ON "Validator"("publicKey");
