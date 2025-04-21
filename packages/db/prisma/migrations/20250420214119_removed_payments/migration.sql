/*
  Warnings:

  - You are about to drop the column `region` on the `ValidatorMeta` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- AlterTable
ALTER TABLE "ValidatorMeta" DROP COLUMN "region";

-- DropTable
DROP TABLE "Payment";
