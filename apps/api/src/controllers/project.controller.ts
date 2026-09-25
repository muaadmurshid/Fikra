import { Response } from "express";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/project.schema";

export async function createProject(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = createProjectSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project data.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { title, description } = result.data;

    const project = await prisma.project.create({
      data: {
        ownerId: req.userId,
        title,
        description,
      },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      project,
    });
  } catch (error) {
    console.error("Create project failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create project.",
    });
  }
}

export async function getProjects(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const projects = await prisma.project.findMany({
      where: {
        ownerId: req.userId,
      },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve projects.",
    });
  }
}

export async function getProjectById(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

const projectId = req.params.projectId;

if (typeof projectId !== "string") {
  return res.status(400).json({
    success: false,
    message: "Invalid project ID.",
  });
}

const project = await prisma.project.findFirst({
     where: {
        id: projectId,
        ownerId: req.userId,
      },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project by ID failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve project.",
    });
  }
}

export async function updateProject(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const projectId = req.params.projectId;

    if (typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const result = updateProjectSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project data.",
        errors: result.error.flatten(),
      });
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: req.userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: result.data,
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project,
    });
  } catch (error) {
    console.error("Update project failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update project.",
    });
  }
}

export async function archiveProject(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const projectId = req.params.projectId;

    if (typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: req.userId,
      },
      select: {
        id: true,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        status: "ARCHIVED",
      },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Project archived successfully.",
      project,
    });
  } catch (error) {
    console.error("Archive project failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to archive project.",
    });
  }
}
