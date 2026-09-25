-- CreateEnum
CREATE TYPE "FileChangeType" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'RESTORED');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('ZIP');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "project_files" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "language" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_file_versions" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT,
    "levelId" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changeType" "FileChangeType" NOT NULL,
    "changeSummary" TEXT,
    "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_builds" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "BuildStatus" NOT NULL DEFAULT 'PENDING',
    "buildNumber" INTEGER NOT NULL,
    "logs" TEXT,
    "artifactPath" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_exports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "format" "ExportFormat" NOT NULL DEFAULT 'ZIP',
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT,
    "fileSize" BIGINT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "project_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_files_projectId_idx" ON "project_files"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_files_projectId_path_key" ON "project_files"("projectId", "path");

-- CreateIndex
CREATE INDEX "project_file_versions_fileId_idx" ON "project_file_versions"("fileId");

-- CreateIndex
CREATE INDEX "project_file_versions_userId_idx" ON "project_file_versions"("userId");

-- CreateIndex
CREATE INDEX "project_file_versions_levelId_idx" ON "project_file_versions"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "project_file_versions_fileId_versionNumber_key" ON "project_file_versions"("fileId", "versionNumber");

-- CreateIndex
CREATE INDEX "project_builds_projectId_idx" ON "project_builds"("projectId");

-- CreateIndex
CREATE INDEX "project_builds_userId_idx" ON "project_builds"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_builds_projectId_buildNumber_key" ON "project_builds"("projectId", "buildNumber");

-- CreateIndex
CREATE INDEX "project_exports_projectId_idx" ON "project_exports"("projectId");

-- CreateIndex
CREATE INDEX "project_exports_userId_idx" ON "project_exports"("userId");

-- AddForeignKey
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_file_versions" ADD CONSTRAINT "project_file_versions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "project_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_file_versions" ADD CONSTRAINT "project_file_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_file_versions" ADD CONSTRAINT "project_file_versions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "coding_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_builds" ADD CONSTRAINT "project_builds_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_builds" ADD CONSTRAINT "project_builds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_exports" ADD CONSTRAINT "project_exports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_exports" ADD CONSTRAINT "project_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
