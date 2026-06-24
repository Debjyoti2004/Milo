-- CreateTable
CREATE TABLE "CardioLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "steps" INTEGER,
    "walkMinutes" INTEGER,
    "hiitMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardioLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardioLog_userId_date_idx" ON "CardioLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CardioLog_userId_date_key" ON "CardioLog"("userId", "date");

-- AddForeignKey
ALTER TABLE "CardioLog" ADD CONSTRAINT "CardioLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
