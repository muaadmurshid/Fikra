import { Router } from "express";

import {
  archiveProject,
  createProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller";
import { requireAuth } from "../middleware/auth.middleware";

import { analyzeProject } from "../controllers/project-ai.controller";

const router = Router();

router.patch("/:projectId/archive", requireAuth, archiveProject);
router.post("/", requireAuth, createProject);
router.get("/", requireAuth, getProjects);
router.get("/:projectId", requireAuth, getProjectById);
router.patch("/:projectId", requireAuth, updateProject);

router.post("/:projectId/analyze", requireAuth, analyzeProject);

export default router;