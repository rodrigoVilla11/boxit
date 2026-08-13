-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "routineId" TEXT;

-- CreateIndex
CREATE INDEX "Workout_routineId_idx" ON "Workout"("routineId");

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
