-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "secondaryMuscles" "Muscle"[] DEFAULT ARRAY[]::"Muscle"[];
