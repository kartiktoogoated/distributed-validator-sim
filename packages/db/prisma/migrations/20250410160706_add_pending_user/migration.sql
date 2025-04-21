/*
  Warnings:

  - You are about to drop the column `otp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpires` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otp",
DROP COLUMN "otpExpires";

-- CreateTable
CREATE TABLE "PendingUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "otpExpires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingUser_email_key" ON "PendingUser"("email");
