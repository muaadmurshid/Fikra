import { Router } from "express";

import {
  archiveProject,
  createProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller";

import {
  answerClarification,
  confirmProject,
  decideSuggestion,
  getClarifications,
  getSuggestions,
} from "../controllers/project-definition.controller";

import {
  getProjectTechnologies,
  recommendTechnologies,
  selectTechnology,
} from "../controllers/technology.controller";

import {
  generateRoadmap,
  getRoadmap,
} from "../controllers/roadmap.controller";

import {
  initializeGameplay,
  getGameplay,
  startLevel,
  completeLevel,
} from "../controllers/gameplay.controller";

import {
  getLevelHints,
  useHint,
  submitAttempt,
} from "../controllers/level-interaction.controller";

import {
  saveProjectFile,
  getProjectFiles,
  getProjectFileVersions,
} from "../controllers/project-file.controller";

import { requireAuth } from "../middleware/auth.middleware";

import { analyzeProject } from "../controllers/project-ai.controller";

const router = Router();

router.patch("/:projectId/archive", requireAuth, archiveProject);

router.get(
  "/:projectId/clarifications",
  requireAuth,
  getClarifications
);

router.post(
  "/:projectId/clarifications/:questionId/answer",
  requireAuth,
  answerClarification
);

router.get(
  "/:projectId/suggestions",
  requireAuth,
  getSuggestions
);

router.patch(
  "/:projectId/suggestions/:suggestionId",
  requireAuth,
  decideSuggestion
);

router.post(
  "/:projectId/confirm",
  requireAuth,
  confirmProject
);

router.post(
  "/:projectId/technologies/recommend",
  requireAuth,
  recommendTechnologies
);

router.get(
  "/:projectId/technologies",
  requireAuth,
  getProjectTechnologies
);

router.patch(
  "/:projectId/technologies/:technologyId",
  requireAuth,
  selectTechnology
);

router.post(
  "/:projectId/roadmap/generate",
  requireAuth,
  generateRoadmap
);

router.get(
  "/:projectId/roadmap",
  requireAuth,
  getRoadmap
);

router.post(
  "/:projectId/gameplay/initialize",
  requireAuth,
  initializeGameplay
);

router.get(
  "/:projectId/gameplay",
  requireAuth,
  getGameplay
);

router.post(
  "/:projectId/levels/:levelId/start",
  requireAuth,
  startLevel
);

router.post(
  "/:projectId/levels/:levelId/complete",
  requireAuth,
  completeLevel
);

router.get(
  "/:projectId/levels/:levelId/hints",
  requireAuth,
  getLevelHints
);

router.post(
  "/:projectId/levels/:levelId/hints/:hintId/use",
  requireAuth,
  useHint
);

router.post(
  "/:projectId/levels/:levelId/attempts",
  requireAuth,
  submitAttempt
);

router.post(
  "/:projectId/files",
  requireAuth,
  saveProjectFile
);

router.get(
  "/:projectId/files",
  requireAuth,
  getProjectFiles
);

router.get(
  "/:projectId/files/:fileId/versions",
  requireAuth,
  getProjectFileVersions
);

router.post("/", requireAuth, createProject);
router.get("/", requireAuth, getProjects);
router.get("/:projectId", requireAuth, getProjectById);
router.patch("/:projectId", requireAuth, updateProject);

router.post("/:projectId/analyze", requireAuth, analyzeProject);

export default router;