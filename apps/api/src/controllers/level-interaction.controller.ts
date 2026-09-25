import { Response } from "express";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { submitAttemptSchema } from "../schemas/gameplay.schema";

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

    const attemptCount = await prisma.levelAttempt.count({
      where: {
        userId: req.userId,
        levelId,
      },
    });

    const attempt = await prisma.levelAttempt.create({
      data: {
        userId: req.userId,
        levelId,
        attemptNumber: attemptCount + 1,
        submittedCode: parsed.data.submittedCode,
        result: parsed.data.result,
        feedback: parsed.data.feedback,
        score: parsed.data.score,
        completedAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message:
        attempt.result === "PASSED"
          ? "Attempt passed."
          : "Attempt failed. Try again.",
      attempt,
    });
  } catch (error) {
    console.error("Submit attempt failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit attempt.",
    });
  }
}