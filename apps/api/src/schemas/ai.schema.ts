import { z } from "zod";

export const projectAnalysisOutputSchema = z.object({
  summary: z.string(),
  problemStatement: z.string(),
  targetUsers: z.array(z.string()),
  coreFeatures: z.array(z.string()),
  goals: z.array(z.string()),
  constraints: z.array(z.string()),
  assumptions: z.array(z.string()),

  clarificationQuestions: z.array(
    z.object({
      question: z.string(),
      reason: z.string(),
    })
  ),

  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      reason: z.string(),
    })
  ),
});

export type ProjectAnalysisOutput = z.infer<
  typeof projectAnalysisOutputSchema
>;