/*
  Warnings:

  - A unique constraint covering the columns `[validatorId]` on the table `ValidatorMeta` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ValidatorMeta_validatorId_key" ON "ValidatorMeta"("validatorId");
