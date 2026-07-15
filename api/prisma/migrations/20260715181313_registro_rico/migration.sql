-- AlterTable
ALTER TABLE "RoutineExercise" ADD COLUMN     "note" TEXT,
ADD COLUMN     "restSeconds" INTEGER,
ADD COLUMN     "targetReps" INTEGER,
ADD COLUMN     "targetWeight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN     "note" TEXT,
ADD COLUMN     "rpe" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Bodyweight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bodyweight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bodyweight_userId_takenAt_idx" ON "Bodyweight"("userId", "takenAt");

-- AddForeignKey
ALTER TABLE "Bodyweight" ADD CONSTRAINT "Bodyweight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
