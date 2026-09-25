import { Response } from "express";

import prisma from "../lib/prisma";
import { OPENAI_MODEL } from "../lib/openai";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { analyzeProjectIdea } from "../services/project-ai.service";

export async function analyzeProject(
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
        description: true,
        status: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (project.status === "ARCHIVED") {
      return res.status(409).json({
        success: false,
        message: "Archived projects cannot be analyzed.",
      });
    }

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        status: "ANALYZING",
      },
    });

    let aiResult;

    try {
      aiResult = await analyzeProjectIdea(
        project.title,
        project.description
      );
    } catch (error) {
      await prisma.project.update({
        where: {
          id: project.id,
        },
        data: {
          status: "DRAFT",
        },
      });

      throw error;
    }

    const savedResult = await prisma.$transaction(async (tx) => {
      // Replace previously generated project-definition data
      // when the owner analyzes the project again.
      await tx.clarificationQuestion.deleteMany({
        where: {
          projectId: project.id,
        },
      });

      await tx.projectSuggestion.deleteMany({
        where: {
          projectId: project.id,
        },
      });

      await tx.projectAnalysis.deleteMany({
        where: {
          projectId: project.id,
        },
      });

      const analysis = await tx.projectAnalysis.create({
        data: {
          projectId: project.id,
          summary: aiResult.summary,
          problemStatement: aiResult.problemStatement,
          targetUsers: JSON.stringify(aiResult.targetUsers),
          coreFeatures: aiResult.coreFeatures,
          functionalReqs: aiResult.goals,
          nonFunctionalReqs: aiResult.constraints,
          assumptions: aiResult.assumptions,
          aiModel:
            process.env.AI_PROVIDER === "openai"
              ? OPENAI_MODEL
              : "mock",
        },
      });

      if (aiResult.clarificationQuestions.length > 0) {
        await tx.clarificationQuestion.createMany({
          data: aiResult.clarificationQuestions.map(
            (item, index) => ({
              projectId: project.id,
              question: item.question,
              questionOrder: index + 1,
              isRequired: true,
            })
          ),
        });
      }

      if (aiResult.suggestions.length > 0) {
        await tx.projectSuggestion.createMany({
          data: aiResult.suggestions.map((item) => ({
            projectId: project.id,
            title: item.title,
            description: item.description,
            reason: item.reason,
          })),
        });
      }

      const nextStatus =
        aiResult.clarificationQuestions.length > 0
          ? "CLARIFYING"
          : "SUGGESTING";

      await tx.project.update({
        where: {
          id: project.id,
        },
        data: {
          status: nextStatus,
        },
      });

      const clarificationQuestions =
        await tx.clarificationQuestion.findMany({
          where: {
            projectId: project.id,
          },
          orderBy: {
            questionOrder: "asc",
          },
        });

      const suggestions =
        await tx.projectSuggestion.findMany({
          where: {
            projectId: project.id,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

      return {
        analysis,
        clarificationQuestions,
        suggestions,
        status: nextStatus,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Project analyzed successfully.",
      ...savedResult,
    });
  } catch (error) {
    console.error("Project analysis failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to analyze project.",
    });
  }
}