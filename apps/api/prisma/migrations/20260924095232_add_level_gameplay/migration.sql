-- CreateEnum
CREATE TYPE "LevelProgressStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LevelAttemptResult" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "level_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "status" "LevelProgressStatus" NOT NULL DEFAULT 'LOCKED',
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "level_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "submittedCode" TEXT,
    "result" "LevelAttemptResult" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "level_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hints" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hintOrder" INTEGER NOT NULL,
    "xpCost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hint_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hintId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hint_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "level_progress_userId_idx" ON "level_progress"("userId");

-- CreateIndex
CREATE INDEX "level_progress_levelId_idx" ON "level_progress"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "level_progress_userId_levelId_key" ON "level_progress"("userId", "levelId");

-- CreateIndex
CREATE INDEX "level_attempts_userId_idx" ON "level_attempts"("userId");

-- CreateIndex
CREATE INDEX "level_attempts_levelId_idx" ON "level_attempts"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "level_attempts_userId_levelId_attemptNumber_key" ON "level_attempts"("userId", "levelId", "attemptNumber");

-- CreateIndex
CREATE INDEX "hints_levelId_idx" ON "hints"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "hints_levelId_hintOrder_key" ON "hints"("levelId", "hintOrder");

-- CreateIndex
CREATE INDEX "hint_usages_userId_idx" ON "hint_usages"("userId");

-- CreateIndex
CREATE INDEX "hint_usages_hintId_idx" ON "hint_usages"("hintId");

-- CreateIndex
CREATE UNIQUE INDEX "hint_usages_userId_hintId_key" ON "hint_usages"("userId", "hintId");

-- AddForeignKey
ALTER TABLE "level_progress" ADD CONSTRAINT "level_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_progress" ADD CONSTRAINT "level_progress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "coding_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_attempts" ADD CONSTRAINT "level_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_attempts" ADD CONSTRAINT "level_attempts_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "coding_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hints" ADD CONSTRAINT "hints_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "coding_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_usages" ADD CONSTRAINT "hint_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_usages" ADD CONSTRAINT "hint_usages_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "hints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
