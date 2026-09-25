import { Router } from "express";

import {
  archiveProject,
  createProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.patch("/:projectId/archive", requireAuth, archiveProject);
router.post("/", requireAuth, createProject);
router.get("/", requireAuth, getProjects);
router.get("/:projectId", requireAuth, getProjectById);
router.patch("/:projectId", requireAuth, updateProject);

export default router;