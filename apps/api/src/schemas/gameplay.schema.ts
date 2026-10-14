import { z } from "zod";

const attemptFileChangeSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, "File path is required.")
    .max(1000),

  content: z
    .string()
    .max(1000000, "File content is too large."),

  language: z
    .string()
    .trim()
    .max(100)
    .optional(),

  changeSummary: z
    .string()
    .trim()
    .max(1000)
    .optional(),
});

export const submitAttemptSchema = z.object({
  submittedCode: z
    .string()
    .trim()
    .min(1, "Submitted code is required.")
    .max(100000, "Submitted code is too large."),

  fileChanges: z
    .array(attemptFileChangeSchema)
    .max(50, "Too many file changes in one attempt.")
    .default([]),
});

export type SubmitAttemptInput = z.infer<
  typeof submitAttemptSchema
>;