-- CreateEnum
CREATE TYPE "BodyPhotoAngle" AS ENUM ('FRONT', 'SIDE', 'BACK');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "lastDeloadAt" TIMESTAMP(3),
ADD COLUMN     "waterTargetMl" INTEGER;

-- CreateTable
CREATE TABLE "WaistLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "waistCm" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaistLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "angle" "BodyPhotoAngle" NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaistLog_userId_date_idx" ON "WaistLog"("userId", "date");

-- CreateIndex
CREATE INDEX "BodyPhoto_userId_date_idx" ON "BodyPhoto"("userId", "date");

-- AddForeignKey
ALTER TABLE "WaistLog" ADD CONSTRAINT "WaistLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyPhoto" ADD CONSTRAINT "BodyPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
