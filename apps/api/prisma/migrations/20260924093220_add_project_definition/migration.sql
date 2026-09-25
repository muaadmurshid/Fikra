-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "project_analyses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "problemStatement" TEXT,
    "targetUsers" TEXT,
    "coreFeatures" JSONB NOT NULL,
    "functionalReqs" JSONB,
    "nonFunctionalReqs" JSONB,
    "assumptions" JSONB,
    "aiModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clarification_questions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clarification_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clarification_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clarification_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_suggestions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_analyses_projectId_idx" ON "project_analyses"("projectId");

-- CreateIndex
CREATE INDEX "clarification_questions_projectId_idx" ON "clarification_questions"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "clarification_questions_projectId_questionOrder_key" ON "clarification_questions"("projectId", "questionOrder");

-- CreateIndex
CREATE UNIQUE INDEX "clarification_answers_questionId_key" ON "clarification_answers"("questionId");

-- CreateIndex
CREATE INDEX "project_suggestions_projectId_idx" ON "project_suggestions"("projectId");

-- AddForeignKey
ALTER TABLE "project_analyses" ADD CONSTRAINT "project_analyses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarification_questions" ADD CONSTRAINT "clarification_questions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarification_answers" ADD CONSTRAINT "clarification_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "clarification_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_suggestions" ADD CONSTRAINT "project_suggestions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
