import { Response } from "express";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { submitAttemptSchema } from "../schemas/gameplay.schema";

import { evaluateLevelAttemptMock } from "../services/mock-level-evaluator.service";
import { saveProjectFileVersion } from "../services/project-file.service";

async function getOwnedProjectLevel(
  projectId: string,
  levelId: string,
  userId: string
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!project) {
    return null;
  }

  const roadmap = await prisma.roadmap.findFirst({
    where: {
      projectId,
      isActive: true,
    },
    select: {
      stages: {
        select: {
          levels: {
            where: {
              id: levelId,
            },
            select: {
              id: true,
              title: true,
              xpReward: true,
            },
          },
        },
      },
    },
  });

  const level =
    roadmap?.stages.flatMap((stage) => stage.levels)[0] ??
    null;

  if (!level) {
    return null;
  }

  return {
    project,
    level,
  };
}

export async function getLevelHints(
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

    const { projectId, levelId } = req.params;

    if (
      typeof projectId !== "string" ||
      typeof levelId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or level ID.",
      });
    }

    const context = await getOwnedProjectLevel(
      projectId,
      levelId,
      req.userId
    );

    if (!context) {
      return res.status(404).json({
        success: false,
        message: "Level not found in this project.",
      });
    }

    const progress = await prisma.levelProgress.findUnique({
      where: {
        userId_levelId: {
          userId: req.userId,
          levelId,
        },
      },
    });

    if (!progress || progress.status === "LOCKED") {
      return res.status(409).json({
        success: false,
        message: "This level is not available yet.",
      });
    }

    const hints = await prisma.hint.findMany({
      where: {
        levelId,
      },
      orderBy: {
        hintOrder: "asc",
      },
      select: {
        id: true,
        hintOrder: true,
        xpCost: true,
        usages: {
          where: {
            userId: req.userId,
          },
          select: {
            usedAt: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      hints: hints.map((hint) => ({
        id: hint.id,
        hintOrder: hint.hintOrder,
        xpCost: hint.xpCost,
        used: hint.usages.length > 0,
      })),
    });
  } catch (error) {
    console.error("Get level hints failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get level hints.",
    });
  }
}

export async function useHint(
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

    const { projectId, levelId, hintId } = req.params;

    if (
      typeof projectId !== "string" ||
      typeof levelId !== "string" ||
      typeof hintId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project, level, or hint ID.",
      });
    }

    const context = await getOwnedProjectLevel(
      projectId,
      levelId,
      req.userId
    );

    if (!context) {
      return res.status(404).json({
        success: false,
        message: "Level not found in this project.",
      });
    }

    const progress = await prisma.levelProgress.findUnique({
      where: {
        userId_levelId: {
          userId: req.userId,
          levelId,
        },
      },
    });

    if (
      !progress ||
      (progress.status !== "IN_PROGRESS" &&
        progress.status !== "COMPLETED")
    ) {
      return res.status(409).json({
        success: false,
        message: "Start the level before using hints.",
      });
    }

    const hint = await prisma.hint.findFirst({
      where: {
        id: hintId,
        levelId,
      },
    });

    if (!hint) {
      return res.status(404).json({
        success: false,
        message: "Hint not found.",
      });
    }

    const usage = await prisma.hintUsage.upsert({
      where: {
        userId_hintId: {
          userId: req.userId,
          hintId,
        },
      },
      update: {},
      create: {
        userId: req.userId,
        hintId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Hint revealed.",
      hint: {
        id: hint.id,
        hintOrder: hint.hintOrder,
        content: hint.content,
        xpCost: hint.xpCost,
        usedAt: usage.usedAt,
      },
    });
  } catch (error) {
    console.error("Use hint failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to use hint.",
    });
  }
}

export async function submitAttempt(
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

    const { projectId, levelId } = req.params;

    if (
      typeof projectId !== "string" ||
      typeof levelId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or level ID.",
      });
    }

    const parsed = submitAttemptSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt data.",
        errors: parsed.error.flatten(),
      });
    }

    const context = await getOwnedProjectLevel(
      projectId,
      levelId,
      req.userId
    );

    if (!context) {
      return res.status(404).json({
        success: false,
        message: "Level not found in this project.",
      });
    }

    if (context.project.status === "ARCHIVED") {
      return res.status(409).json({
        success: false,
        message: "Archived projects cannot be modified.",
      });
    }

    const progress = await prisma.levelProgress.findUnique({
      where: {
        userId_levelId: {
          userId: req.userId,
          levelId,
        },
      },
    });

    if (!progress) {
      return res.status(409).json({
        success: false,
        message: "Gameplay has not been initialized.",
      });
    }

    if (progress.status !== "IN_PROGRESS") {
      return res.status(409).json({
        success: false,
        message:
          "The level must be in progress before submitting an attempt.",
      });
    }

   
    const evaluation = evaluateLevelAttemptMock({
        submittedCode: parsed.data.submittedCode,
        levelTitle: context.level.title,
        fileChanges: parsed.data.fileChanges,
    });


    const result = await prisma.$transaction(
      async (tx) => {
        const latestAttempt =
          await tx.levelAttempt.findFirst({
            where: {
              userId: req.userId!,
              levelId,
            },
            orderBy: {
              attemptNumber: "desc",
            },
            select: {
              attemptNumber: true,
            },
          });

        const attempt =
          await tx.levelAttempt.create({
            data: {
              userId: req.userId!,
              levelId,
              attemptNumber:
                (latestAttempt?.attemptNumber ?? 0) + 1,
              submittedCode:
                parsed.data.submittedCode,
              result: evaluation.result,
              feedback: evaluation.feedback,
              score: evaluation.score,
              completedAt: new Date(),
            },
          });

        const fileChanges = [];

        if (evaluation.result === "PASSED") {
          for (const change of parsed.data.fileChanges) {
            const saved =
              await saveProjectFileVersion(tx, {
                projectId,
                userId: req.userId!,
                levelId,
                path: change.path,
                content: change.content,
                language: change.language,
                changeSummary:
                  change.changeSummary ??
                  `Applied by level attempt #${attempt.attemptNumber}.`,
                generatedByAi: false,
              });

            fileChanges.push({
              file: saved.file,
              version: saved.version,
            });
          }
        }

        return {
          attempt,
          fileChanges,
        };
      }
    );

    return res.status(201).json({
      success: true,
      message:
        result.attempt.result === "PASSED"
          ? "Attempt passed and project file changes were applied."
          : "Attempt failed. Project files were not changed.",
      attempt: result.attempt,
      appliedFileChanges: result.fileChanges,
    });
  } catch (error) {
    console.error("Submit attempt failed:", error);

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
      message: "Unable to submit attempt.",
    });
  }
}