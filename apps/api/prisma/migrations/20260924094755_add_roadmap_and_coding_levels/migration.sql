-- CreateEnum
CREATE TYPE "LevelDifficulty" AS ENUM ('BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'ADVANCED');

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_stages" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stageOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_levels" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "levelOrder" INTEGER NOT NULL,
    "difficulty" "LevelDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_level_dependencies" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "requiredLevelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_level_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roadmaps_projectId_idx" ON "roadmaps"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmaps_projectId_version_key" ON "roadmaps"("projectId", "version");

-- CreateIndex
CREATE INDEX "roadmap_stages_roadmapId_idx" ON "roadmap_stages"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_stages_roadmapId_stageOrder_key" ON "roadmap_stages"("roadmapId", "stageOrder");

-- CreateIndex
CREATE INDEX "coding_levels_stageId_idx" ON "coding_levels"("stageId");

-- CreateIndex
CREATE UNIQUE INDEX "coding_levels_stageId_levelOrder_key" ON "coding_levels"("stageId", "levelOrder");

-- CreateIndex
CREATE INDEX "coding_level_dependencies_levelId_idx" ON "coding_level_dependencies"("levelId");

-- CreateIndex
CREATE INDEX "coding_level_dependencies_requiredLevelId_idx" ON "coding_level_dependencies"("requiredLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "coding_level_dependencies_levelId_requiredLevelId_key" ON "coding_level_dependencies"("levelId", "requiredLevelId");

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_stages" ADD CONSTRAINT "roadmap_stages_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_levels" ADD CONSTRAINT "coding_levels_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "roadmap_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_level_dependencies" ADD CONSTRAINT "coding_level_dependencies_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "coding_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_level_dependencies" ADD CONSTRAINT "coding_level_dependencies_requiredLevelId_fkey" FOREIGN KEY ("requiredLevelId") REFERENCES "coding_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
