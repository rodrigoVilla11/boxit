-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('RUN', 'SWIM', 'BIKE', 'ROW', 'WALK', 'OTHER');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "label" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "distanceM" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityInterval" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT,
    "reps" INTEGER NOT NULL DEFAULT 1,
    "distanceM" INTEGER,
    "durationSec" INTEGER,
    "restSec" INTEGER,

    CONSTRAINT "ActivityInterval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_userId_performedAt_idx" ON "Activity"("userId", "performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityInterval_activityId_order_key" ON "ActivityInterval"("activityId", "order");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityInterval" ADD CONSTRAINT "ActivityInterval_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
