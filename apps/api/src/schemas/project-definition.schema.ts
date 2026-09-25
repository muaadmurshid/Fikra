import { z } from "zod";

export const clarificationAnswerSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(1, "Answer is required.")
    .max(5000, "Answer must be 5000 characters or fewer."),
});

export const suggestionDecisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export type ClarificationAnswerInput = z.infer<
  typeof clarificationAnswerSchema
>;

export type SuggestionDecisionInput = z.infer<
  typeof suggestionDecisionSchema
>;