-- CreateTable
CREATE TABLE "ValidatorLog" (
    "id" SERIAL NOT NULL,
    "validatorId" INTEGER NOT NULL,
    "site" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidatorLog_pkey" PRIMARY KEY ("id")
);
