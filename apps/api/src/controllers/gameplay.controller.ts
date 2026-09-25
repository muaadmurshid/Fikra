import { Response } from "express";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

async function findOwnedProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
      ownerId: true,
      status: true,
    },
  });
}

async function getOrderedLevels(projectId: string) {
  const roadmap = await prisma.roadmap.findFirst({
    where: {
      projectId,
      isActive: true,
    },
    orderBy: {
      version: "desc",
    },
    include: {
      stages: {
        orderBy: {
          stageOrder: "asc",
        },
        include: {
          levels: {
            orderBy: {
              levelOrder: "asc",
            },
          },
        },
      },
    },
  });

  if (!roadmap) {
    return null;
  }

  const levels = roadmap.stages.flatMap((stage) =>
    stage.levels.map((level) => ({
      ...level,
      stageOrder: stage.stageOrder,
      stageTitle: stage.title,
    }))
  );

  return {
    roadmap,
    levels,
  };
}

export async function initializeGameplay(
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

    const project = await findOwnedProject(projectId, req.userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (
      project.status !== "ROADMAP_READY" &&
      project.status !== "IN_PROGRESS"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Project must have a ready roadmap before gameplay can be initialized.",
      });
    }

    const roadmapResult = await getOrderedLevels(projectId);

    if (!roadmapResult || roadmapResult.levels.length === 0) {
      return res.status(409).json({
        success: false,
        message: "No coding levels were found for the active roadmap.",
      });
    }

    const existingProgress = await prisma.levelProgress.findMany({
      where: {
        userId: req.userId,
        levelId: {
          in: roadmapResult.levels.map((level) => level.id),
        },
      },
    });

    if (existingProgress.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Gameplay has already been initialized for this project.",
      });
    }

    await prisma.$transaction(async (tx) => {
      for (
        let index = 0;
        index < roadmapResult.levels.length;
        index++
      ) {
        await tx.levelProgress.create({
          data: {
            userId: req.userId!,
            levelId: roadmapResult.levels[index].id,
            status: index === 0 ? "AVAILABLE" : "LOCKED",
          },
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: "Gameplay initialized successfully.",
      totalLevels: roadmapResult.levels.length,
      availableLevels: 1,
      lockedLevels: roadmapResult.levels.length - 1,
    });
  } catch (error) {
    console.error("Initialize gameplay failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to initialize gameplay.",
    });
  }
}

export async function getGameplay(
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

    const project = await findOwnedProject(projectId, req.userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const roadmapResult = await getOrderedLevels(projectId);

    if (!roadmapResult) {
      return res.status(404).json({
        success: false,
        message: "Active roadmap not found.",
      });
    }

    const progress = await prisma.levelProgress.findMany({
      where: {
        userId: req.userId,
        levelId: {
          in: roadmapResult.levels.map((level) => level.id),
        },
      },
    });

    const progressMap = new Map(
      progress.map((item) => [item.levelId, item])
    );

    const levels = roadmapResult.levels.map(
      (level, index) => ({
        number: index + 1,
        id: level.id,
        stageOrder: level.stageOrder,
        stageTitle: level.stageTitle,
        title: level.title,
        description: level.description,
        instructions: level.instructions,
        difficulty: level.difficulty,
        xpReward: level.xpReward,
        progress: progressMap.get(level.id) ?? null,
      })
    );

    return res.status(200).json({
      success: true,
      projectStatus: project.status,
      roadmapId: roadmapResult.roadmap.id,
      totalLevels: levels.length,
      levels,
    });
  } catch (error) {
    console.error("Get gameplay failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get gameplay.",
    });
  }
}

export async function startLevel(
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

    const project = await findOwnedProject(projectId, req.userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const roadmapResult = await getOrderedLevels(projectId);

    if (!roadmapResult) {
      return res.status(404).json({
        success: false,
        message: "Active roadmap not found.",
      });
    }

    const belongsToProject = roadmapResult.levels.some(
      (level) => level.id === levelId
    );

    if (!belongsToProject) {
      return res.status(404).json({
        success: false,
        message: "Coding level not found in this project.",
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
        message: "Gameplay has not been initialized for this level.",
      });
    }

    if (progress.status === "LOCKED") {
      return res.status(409).json({
        success: false,
        message: "This level is still locked.",
      });
    }

    if (progress.status === "COMPLETED") {
      return res.status(409).json({
        success: false,
        message: "This level has already been completed.",
      });
    }

    if (progress.status === "IN_PROGRESS") {
      return res.status(200).json({
        success: true,
        message: "Level is already in progress.",
        progress,
      });
    }

    const updatedProgress = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.levelProgress.update({
          where: {
            userId_levelId: {
              userId: req.userId!,
              levelId,
            },
          },
          data: {
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });

        if (project.status === "ROADMAP_READY") {
          await tx.project.update({
            where: {
              id: projectId,
            },
            data: {
              status: "IN_PROGRESS",
            },
          });
        }

        return updated;
      }
    );

    return res.status(200).json({
      success: true,
      message: "Level started successfully.",
      progress: updatedProgress,
    });
  } catch (error) {
    console.error("Start level failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start level.",
    });
  }
}

export async function completeLevel(
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

    const project = await findOwnedProject(projectId, req.userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const roadmapResult = await getOrderedLevels(projectId);

    if (!roadmapResult) {
      return res.status(404).json({
        success: false,
        message: "Active roadmap not found.",
      });
    }

    const currentIndex = roadmapResult.levels.findIndex(
      (level) => level.id === levelId
    );

    if (currentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Coding level not found in this project.",
      });
    }

    const level = roadmapResult.levels[currentIndex];

    const result = await prisma.$transaction(async (tx) => {
      const progress = await tx.levelProgress.findUnique({
        where: {
          userId_levelId: {
            userId: req.userId!,
            levelId,
          },
        },
      });

      if (!progress) {
        throw new Error("PROGRESS_NOT_FOUND");
      }

      if (progress.status === "COMPLETED") {
        throw new Error("LEVEL_ALREADY_COMPLETED");
      }

      if (progress.status !== "IN_PROGRESS") {
        throw new Error("LEVEL_NOT_IN_PROGRESS");
      }

      const passedAttempt = await tx.levelAttempt.findFirst({
  where: {
    userId: req.userId!,
    levelId,
    result: "PASSED",
  },
  orderBy: {
    attemptNumber: "desc",
  },
});

if (!passedAttempt) {
  throw new Error("NO_PASSED_ATTEMPT");
}
      const completedProgress =
        await tx.levelProgress.update({
          where: {
            userId_levelId: {
              userId: req.userId!,
              levelId,
            },
          },
          data: {
            status: "COMPLETED",
            xpEarned: level.xpReward,
            completedAt: new Date(),
          },
        });

      const user = await tx.user.update({
        where: {
          id: req.userId!,
        },
        data: {
          xp: {
            increment: level.xpReward,
          },
        },
        select: {
          id: true,
          xp: true,
          level: true,
        },
      });

      const nextLevel =
        roadmapResult.levels[currentIndex + 1] ?? null;

      let nextProgress = null;

      if (nextLevel) {
        nextProgress = await tx.levelProgress.update({
          where: {
            userId_levelId: {
              userId: req.userId!,
              levelId: nextLevel.id,
            },
          },
          data: {
            status: "AVAILABLE",
          },
        });
      } else {
        await tx.project.update({
          where: {
            id: projectId,
          },
          data: {
            status: "COMPLETED",
          },
        });
      }

      return {
        completedProgress,
        nextLevel,
        nextProgress,
        user,
      };
    });

    return res.status(200).json({
      success: true,
      message: result.nextLevel
        ? "Level completed and the next level was unlocked."
        : "Final level completed. Project completed.",
      xpAwarded: level.xpReward,
      userXp: result.user.xp,
      completedProgress: result.completedProgress,
      nextLevel: result.nextLevel
        ? {
            id: result.nextLevel.id,
            title: result.nextLevel.title,
            status: result.nextProgress?.status,
          }
        : null,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PROGRESS_NOT_FOUND"
    ) {
      return res.status(409).json({
        success: false,
        message: "Gameplay has not been initialized for this level.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "LEVEL_ALREADY_COMPLETED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This level has already been completed. XP was not awarded again.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "LEVEL_NOT_IN_PROGRESS"
    ) {
      return res.status(409).json({
        success: false,
        message: "Start the level before completing it.",
      });
    }

    if (
  error instanceof Error &&
  error.message === "NO_PASSED_ATTEMPT"
) {
  return res.status(409).json({
    success: false,
    message:
      "A passed attempt is required before completing this level.",
  });
}

    console.error("Complete level failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete level.",
    });
  }
}