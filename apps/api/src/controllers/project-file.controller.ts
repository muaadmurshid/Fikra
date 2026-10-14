import { Response } from "express";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { saveProjectFileSchema } from "../schemas/project-file.schema";
import {
  isValidProjectPath,
  normalizeProjectPath,
  saveProjectFileVersion,
} from "../services/project-file.service";

async function findOwnedProject(
  projectId: string,
  userId: string
) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      status: true,
    },
  });
}

async function levelBelongsToProject(
  projectId: string,
  levelId: string
) {
  const level = await prisma.codingLevel.findFirst({
    where: {
      id: levelId,
      stage: {
        roadmap: {
          projectId,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(level);
}

export async function saveProjectFile(
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

    const parsed = saveProjectFileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project file data.",
        errors: parsed.error.flatten(),
      });
    }

    const project = await findOwnedProject(
      projectId,
      req.userId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (project.status === "ARCHIVED") {
      return res.status(409).json({
        success: false,
        message: "Archived projects cannot be modified.",
      });
    }

    const normalizedPath = normalizeProjectPath(
      parsed.data.path
    );

    if (!isValidProjectPath(normalizedPath)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project file path.",
      });
    }

    if (parsed.data.levelId) {
      const validLevel = await levelBelongsToProject(
        projectId,
        parsed.data.levelId
      );

      if (!validLevel) {
        return res.status(400).json({
          success: false,
          message:
            "The supplied level does not belong to the active project roadmap.",
        });
      }
    }

    const result = await prisma.$transaction(
      async (tx) => {
        return saveProjectFileVersion(tx, {
          projectId,
          userId: req.userId!,
          levelId: parsed.data.levelId,
          path: normalizedPath,
          content: parsed.data.content,
          language: parsed.data.language,
          changeSummary: parsed.data.changeSummary,
          generatedByAi: parsed.data.generatedByAi,
        });
      }
    );

    return res.status(201).json({
      success: true,
      message:
        result.version.changeType === "CREATED"
          ? "Project file created successfully."
          : result.version.changeType === "RESTORED"
            ? "Project file restored successfully."
            : "Project file updated successfully.",
      file: result.file,
      version: result.version,
    });
  } catch (error) {
    console.error("Save project file failed:", error);

    if (
      error instanceof Error &&
      error.message === "INVALID_PROJECT_FILE_PATH"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project file path.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to save project file.",
    });
  }
}

export async function getProjectFiles(
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

    const project = await findOwnedProject(
      projectId,
      req.userId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const files = await prisma.projectFile.findMany({
      where: {
        projectId,
        isDeleted: false,
      },
      orderBy: {
        path: "asc",
      },
      include: {
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
          take: 1,
        },
      },
    });

    return res.status(200).json({
      success: true,
      files: files.map((file) => ({
        id: file.id,
        path: file.path,
        fileName: file.fileName,
        language: file.language,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        latestVersion: file.versions[0] ?? null,
      })),
    });
  } catch (error) {
    console.error("Get project files failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get project files.",
    });
  }
}

export async function getProjectFileVersions(
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

    const { projectId, fileId } = req.params;

    if (
      typeof projectId !== "string" ||
      typeof fileId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or file ID.",
      });
    }

    const project = await findOwnedProject(
      projectId,
      req.userId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const file = await prisma.projectFile.findFirst({
      where: {
        id: fileId,
        projectId,
      },
      include: {
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Project file not found.",
      });
    }

    return res.status(200).json({
      success: true,
      file: {
        id: file.id,
        path: file.path,
        fileName: file.fileName,
        language: file.language,
        isDeleted: file.isDeleted,
      },
      versions: file.versions,
    });
  } catch (error) {
    console.error(
      "Get project file versions failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to get project file version history.",
    });
  }
}