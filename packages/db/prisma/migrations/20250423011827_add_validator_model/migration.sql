-- CreateTable
CREATE TABLE "Validator" (
    "id" INTEGER NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Validator_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ValidatorLog" ADD CONSTRAINT "ValidatorLog_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatorMeta" ADD CONSTRAINT "ValidatorMeta_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "Validator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
