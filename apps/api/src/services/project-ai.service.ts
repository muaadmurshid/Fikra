import { zodTextFormat } from "openai/helpers/zod";

import { openai, OPENAI_MODEL } from "../lib/openai";
import {
  ProjectAnalysisOutput,
  projectAnalysisOutputSchema,
} from "../schemas/ai.schema";
import { analyzeProjectIdeaMock } from "./mock-project-ai.service";

const AI_PROVIDER = process.env.AI_PROVIDER || "mock";

async function analyzeProjectIdeaOpenAI(
  title: string,
  description: string
): Promise<ProjectAnalysisOutput> {
  const response = await openai.responses.parse({
    model: OPENAI_MODEL,

    reasoning: {
      effort: "medium",
    },

    input: [
      {
        role: "system",
        content: `
You are Fikra's senior software product analyst.

Fikra is a gamified software-development platform. A user describes a
software idea, Fikra analyzes it, asks clarification questions, suggests
improvements, then eventually creates a technology selection and a
progressive coding roadmap.

Analyze the idea as a software product.

Your analysis must:
- preserve the user's core idea;
- identify the problem being solved;
- identify likely target users;
- identify the essential features;
- identify product goals;
- identify meaningful technical or product constraints;
- clearly separate assumptions from known information;
- ask clarification questions only where the answer could materially
  affect requirements, architecture, technology choice, or roadmap;
- provide practical suggestions that improve the project without
  replacing the user's idea;
- avoid choosing the final technology stack yet;
- avoid generating the coding roadmap yet.

Clarification questions should be concise and understandable to someone
who may not be an experienced developer.
        `.trim(),
      },
      {
        role: "user",
        content: `
Project title:
${title}

Project description:
${description}
        `.trim(),
      },
    ],

    text: {
      format: zodTextFormat(
        projectAnalysisOutputSchema,
        "fikra_project_analysis"
      ),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "AI project analysis did not return structured output."
    );
  }

  return response.output_parsed;
}

export async function analyzeProjectIdea(
  title: string,
  description: string
): Promise<ProjectAnalysisOutput> {
  if (AI_PROVIDER === "mock") {
    return analyzeProjectIdeaMock(title, description);
  }

  if (AI_PROVIDER === "openai") {
    return analyzeProjectIdeaOpenAI(title, description);
  }

  throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
}