/*
  Warnings:

  - Added the required column `region` to the `ValidatorMeta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ValidatorMeta" ADD COLUMN     "region" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "validatorId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "txHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
