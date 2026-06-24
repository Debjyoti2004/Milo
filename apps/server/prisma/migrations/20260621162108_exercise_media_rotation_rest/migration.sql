-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'GIF', 'VIDEO');

-- CreateEnum
CREATE TYPE "SetType" AS ENUM ('WARMUP', 'NORMAL', 'DROP', 'FAILURE');

-- AlterTable
ALTER TABLE "RoutineExercise" ADD COLUMN     "alternativeExerciseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "defaultWeightKg" DOUBLE PRECISION,
ADD COLUMN     "restSeconds" INTEGER NOT NULL DEFAULT 90;

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "restSeconds" INTEGER NOT NULL DEFAULT 90;

-- AlterTable
ALTER TABLE "SetLog" ADD COLUMN     "restSecondsAfter" INTEGER,
ADD COLUMN     "setType" "SetType" NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "ExerciseMedia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseMedia_userId_exerciseId_idx" ON "ExerciseMedia"("userId", "exerciseId");

-- AddForeignKey
ALTER TABLE "ExerciseMedia" ADD CONSTRAINT "ExerciseMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMedia" ADD CONSTRAINT "ExerciseMedia_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
