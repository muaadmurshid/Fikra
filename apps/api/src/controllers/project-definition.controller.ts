import { Response } from "express";

import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  clarificationAnswerSchema,
  suggestionDecisionSchema,
} from "../schemas/project-definition.schema";

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
      status: true,
    },
  });
}

export async function getClarifications(
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

    const questions =
      await prisma.clarificationQuestion.findMany({
        where: {
          projectId,
        },
        include: {
          answer: true,
        },
        orderBy: {
          questionOrder: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error("Get clarifications failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get clarification questions.",
    });
  }
}

export async function answerClarification(
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
    const questionId = req.params.questionId;

    if (
      typeof projectId !== "string" ||
      typeof questionId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or question ID.",
      });
    }

    const result = clarificationAnswerSchema.safeParse(
      req.body
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid clarification answer.",
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

    if (project.status !== "CLARIFYING") {
      return res.status(409).json({
        success: false,
        message:
          "Project is not currently accepting clarification answers.",
      });
    }

    const question =
      await prisma.clarificationQuestion.findFirst({
        where: {
          id: questionId,
          projectId,
        },
        select: {
          id: true,
        },
      });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Clarification question not found.",
      });
    }

    const answer = await prisma.clarificationAnswer.upsert({
      where: {
        questionId,
      },
      update: {
        answer: result.data.answer,
      },
      create: {
        questionId,
        answer: result.data.answer,
      },
    });

    const unansweredRequired =
      await prisma.clarificationQuestion.count({
        where: {
          projectId,
          isRequired: true,
          answer: null,
        },
      });

let status: "CLARIFYING" | "SUGGESTING" = "CLARIFYING";

if (unansweredRequired === 0) {
  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      status: "SUGGESTING",
    },
  });

  status = "SUGGESTING";
}

    return res.status(200).json({
      success: true,
      message: "Clarification answer saved.",
      answer,
      remainingRequiredQuestions: unansweredRequired,
      status,
    });
  } catch (error) {
    console.error("Answer clarification failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save clarification answer.",
    });
  }
}

export async function getSuggestions(
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

    const suggestions =
      await prisma.projectSuggestion.findMany({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    return res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("Get suggestions failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get project suggestions.",
    });
  }
}

export async function decideSuggestion(
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
    const suggestionId = req.params.suggestionId;

    if (
      typeof projectId !== "string" ||
      typeof suggestionId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or suggestion ID.",
      });
    }

    const result = suggestionDecisionSchema.safeParse(
      req.body
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid suggestion decision.",
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

    if (project.status !== "SUGGESTING") {
      return res.status(409).json({
        success: false,
        message:
          "Project is not currently accepting suggestion decisions.",
      });
    }

    const suggestion =
      await prisma.projectSuggestion.findFirst({
        where: {
          id: suggestionId,
          projectId,
        },
        select: {
          id: true,
        },
      });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Project suggestion not found.",
      });
    }

    const updatedSuggestion =
      await prisma.projectSuggestion.update({
        where: {
          id: suggestionId,
        },
        data: {
          status: result.data.status,
        },
      });

    const pendingSuggestions =
      await prisma.projectSuggestion.count({
        where: {
          projectId,
          status: "PENDING",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Suggestion decision saved.",
      suggestion: updatedSuggestion,
      pendingSuggestions,
    });
  } catch (error) {
    console.error("Suggestion decision failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save suggestion decision.",
    });
  }
}

export async function confirmProject(
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

    if (project.status !== "SUGGESTING") {
      return res.status(409).json({
        success: false,
        message: "Project is not ready for confirmation.",
      });
    }

    const unansweredRequired =
      await prisma.clarificationQuestion.count({
        where: {
          projectId,
          isRequired: true,
          answer: null,
        },
      });

    if (unansweredRequired > 0) {
      return res.status(409).json({
        success: false,
        message:
          "All required clarification questions must be answered.",
        remainingRequiredQuestions: unansweredRequired,
      });
    }

    const pendingSuggestions =
      await prisma.projectSuggestion.count({
        where: {
          projectId,
          status: "PENDING",
        },
      });

    if (pendingSuggestions > 0) {
      return res.status(409).json({
        success: false,
        message:
          "All project suggestions must be accepted or rejected before confirmation.",
        pendingSuggestions,
      });
    }

    const confirmedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        status: "CONFIRMED",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Project confirmed successfully.",
      project: confirmedProject,
    });
  } catch (error) {
    console.error("Confirm project failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to confirm project.",
    });
  }
}