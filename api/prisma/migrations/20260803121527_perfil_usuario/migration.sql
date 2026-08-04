-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "Bodyweight" ADD COLUMN     "bodyFatPct" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "goalWeightKg" DOUBLE PRECISION,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "sex" "Sex";
