-- CreateEnum
CREATE TYPE "TrackingMode" AS ENUM ('REPS', 'TIME', 'BOTH');

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RoutineExercise" ADD COLUMN     "targetHoldSeconds" INTEGER,
ADD COLUMN     "trackingMode" "TrackingMode" NOT NULL DEFAULT 'REPS';

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "targetHoldSeconds" INTEGER,
ADD COLUMN     "trackingMode" "TrackingMode" NOT NULL DEFAULT 'REPS';

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
