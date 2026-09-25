import { z } from "zod";

export const submitAttemptSchema = z.object({
  submittedCode: z
    .string()
    .trim()
    .min(1, "Submitted code is required.")
    .max(100000, "Submitted code is too large."),

  result: z.enum(["PASSED", "FAILED"]),

  feedback: z
    .string()
    .trim()
    .max(5000)
    .optional(),

  score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional(),
});

export type SubmitAttemptInput = z.infer<
  typeof submitAttemptSchema
>;