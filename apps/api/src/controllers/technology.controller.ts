import { Response } from "express";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { technologySelectionSchema } from "../schemas/technology.schema";

async function findOwnedProject(
  projectId: string,
  ownerId: string
) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
    },
  });
}

export async function getTechnologies(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const technologies = await prisma.technology.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      technologies,
    });
  } catch (error) {
    console.error("Get technologies failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get technologies.",
    });
  }
}

export async function recommendTechnologies(
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

    if (project.status !== "CONFIRMED") {
      return res.status(409).json({
        success: false,
        message:
          "Project must be confirmed before technologies can be recommended.",
      });
    }

    const recommendationNames = [
      "TypeScript",
      "React Native",
      "Expo",
      "Node.js",
      "Express",
      "PostgreSQL",
      "Prisma",
    ];

    const technologies = await prisma.technology.findMany({
      where: {
        name: {
          in: recommendationNames,
        },
      },
    });

    const technologiesByName = new Map(
      technologies.map((technology) => [
        technology.name,
        technology,
      ])
    );

    const missingTechnologies =
      recommendationNames.filter(
        (name) => !technologiesByName.has(name)
      );

    if (missingTechnologies.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Technology catalog is missing required technologies.",
        missingTechnologies,
      });
    }

    const reasons: Record<string, string> = {
      TypeScript:
        "Provides type safety across the mobile and backend codebases.",
      "React Native":
        "Supports building the StudyFlow mobile application for multiple platforms from one codebase.",
      Expo:
        "Simplifies React Native development, testing, builds, and access to common mobile capabilities.",
      "Node.js":
        "Provides a JavaScript and TypeScript runtime for the backend API.",
      Express:
        "Provides a lightweight HTTP API framework for the backend.",
      PostgreSQL:
        "Provides reliable relational storage for users, courses, assignments, exams, study sessions, and progress data.",
      Prisma:
        "Provides type-safe database access and schema management for PostgreSQL.",
    };

    await prisma.$transaction(async (tx) => {
      await tx.projectTechnology.deleteMany({
        where: {
          projectId,
        },
      });

      for (const name of recommendationNames) {
        const technology = technologiesByName.get(name);

        if (!technology) {
          throw new Error(
            `Technology disappeared from catalog: ${name}`
          );
        }

        await tx.projectTechnology.create({
          data: {
            projectId,
            technologyId: technology.id,
            recommendedByAi: true,
            selected: false,
            reason: reasons[name],
          },
        });
      }
    });

    const recommendations =
      await prisma.projectTechnology.findMany({
        where: {
          projectId,
        },
        include: {
          technology: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Technology recommendations generated.",
      recommendations,
    });
  } catch (error) {
    console.error(
      "Technology recommendation failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate technology recommendations.",
    });
  }
}

export async function getProjectTechnologies(
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

    const technologies =
      await prisma.projectTechnology.findMany({
        where: {
          projectId,
        },
        include: {
          technology: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      technologies,
    });
  } catch (error) {
    console.error(
      "Get project technologies failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to get project technologies.",
    });
  }
}

export async function selectTechnology(
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
    const technologyId = req.params.technologyId;

    if (
      typeof projectId !== "string" ||
      typeof technologyId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or technology ID.",
      });
    }

    const result = technologySelectionSchema.safeParse(
      req.body
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid technology selection.",
        errors: result.error.flatten(),
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

    if (project.status !== "CONFIRMED") {
      return res.status(409).json({
        success: false,
        message:
          "Technology selections can only be changed for a confirmed project.",
      });
    }

    const projectTechnology =
      await prisma.projectTechnology.findUnique({
        where: {
          projectId_technologyId: {
            projectId,
            technologyId,
          },
        },
      });

    if (!projectTechnology) {
      return res.status(404).json({
        success: false,
        message:
          "Technology recommendation not found for this project.",
      });
    }

    const updated =
      await prisma.projectTechnology.update({
        where: {
          id: projectTechnology.id,
        },
        data: {
          selected: result.data.selected,
        },
        include: {
          technology: true,
        },
      });

    return res.status(200).json({
      success: true,
      message: result.data.selected
        ? "Technology selected."
        : "Technology deselected.",
      projectTechnology: updated,
    });
  } catch (error) {
    console.error("Technology selection failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update technology selection.",
    });
  }
}