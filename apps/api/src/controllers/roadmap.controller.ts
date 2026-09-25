import { Response } from "express";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { generateMockRoadmap } from "../services/mock-roadmap.service";

export async function generateRoadmap(
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
        title: true,
        status: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (project.status !== "CONFIRMED") {
      return res.status(409).json({
        success: false,
        message:
          "Project must be confirmed before generating a roadmap.",
      });
    }

    const selectedTechnologies =
      await prisma.projectTechnology.findMany({
        where: {
          projectId,
          selected: true,
        },
        include: {
          technology: true,
        },
      });

    if (selectedTechnologies.length === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Select at least one technology before generating a roadmap.",
      });
    }

    const technologyNames = selectedTechnologies.map(
      (item) => item.technology.name
    );

    const roadmapData = generateMockRoadmap(
      project.title,
      technologyNames
    );

    const roadmap = await prisma.$transaction(async (tx) => {
      await tx.roadmap.updateMany({
        where: {
          projectId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      const latestRoadmap = await tx.roadmap.findFirst({
        where: {
          projectId,
        },
        orderBy: {
          version: "desc",
        },
        select: {
          version: true,
        },
      });

      const version = (latestRoadmap?.version ?? 0) + 1;

      const createdRoadmap = await tx.roadmap.create({
        data: {
          projectId,
          title: roadmapData.title,
          description: roadmapData.description,
          version,
          isActive: true,
        },
      });

      let previousLevelId: string | null = null;

      for (
        let stageIndex = 0;
        stageIndex < roadmapData.stages.length;
        stageIndex++
      ) {
        const stageData = roadmapData.stages[stageIndex];

        const stage = await tx.roadmapStage.create({
          data: {
            roadmapId: createdRoadmap.id,
            title: stageData.title,
            description: stageData.description,
            stageOrder: stageIndex + 1,
          },
        });

        for (
          let levelIndex = 0;
          levelIndex < stageData.levels.length;
          levelIndex++
        ) {
          const levelData = stageData.levels[levelIndex];

          const level = await tx.codingLevel.create({
            data: {
              stageId: stage.id,
              title: levelData.title,
              description: levelData.description,
              instructions: levelData.instructions,
              levelOrder: levelIndex + 1,
              difficulty: levelData.difficulty,
              xpReward: levelData.xpReward,
            },
          });

          if (previousLevelId) {
            await tx.codingLevelDependency.create({
              data: {
                levelId: level.id,
                requiredLevelId: previousLevelId,
              },
            });
          }

          previousLevelId = level.id;
        }
      }

      await tx.project.update({
        where: {
          id: projectId,
        },
        data: {
          status: "ROADMAP_READY",
        },
      });

      return tx.roadmap.findUnique({
        where: {
          id: createdRoadmap.id,
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
                include: {
                  dependencies: true,
                },
              },
            },
          },
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Roadmap generated successfully.",
      roadmap,
    });
  } catch (error) {
    console.error("Roadmap generation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate roadmap.",
    });
  }
}

export async function getRoadmap(
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
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

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
              include: {
                dependencies: true,
              },
            },
          },
        },
      },
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Active roadmap not found.",
      });
    }

    return res.status(200).json({
      success: true,
      roadmap,
    });
  } catch (error) {
    console.error("Get roadmap failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get roadmap.",
    });
  }
}