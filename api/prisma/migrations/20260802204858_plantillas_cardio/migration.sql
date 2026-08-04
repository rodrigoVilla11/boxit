-- AlterTable
ALTER TABLE "PlanItem" ADD COLUMN     "cardioRoutineId" TEXT;

-- CreateTable
CREATE TABLE "CardioRoutine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "targetDistanceM" INTEGER,
    "targetDurationSec" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardioRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardioRoutineInterval" (
    "id" TEXT NOT NULL,
    "cardioRoutineId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT,
    "reps" INTEGER NOT NULL DEFAULT 1,
    "distanceM" INTEGER,
    "durationSec" INTEGER,
    "restSec" INTEGER,

    CONSTRAINT "CardioRoutineInterval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardioRoutine_userId_idx" ON "CardioRoutine"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CardioRoutineInterval_cardioRoutineId_order_key" ON "CardioRoutineInterval"("cardioRoutineId", "order");

-- AddForeignKey
ALTER TABLE "CardioRoutine" ADD CONSTRAINT "CardioRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardioRoutineInterval" ADD CONSTRAINT "CardioRoutineInterval_cardioRoutineId_fkey" FOREIGN KEY ("cardioRoutineId") REFERENCES "CardioRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_cardioRoutineId_fkey" FOREIGN KEY ("cardioRoutineId") REFERENCES "CardioRoutine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
