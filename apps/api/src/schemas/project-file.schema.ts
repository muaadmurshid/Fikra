import { z } from "zod";

export const saveProjectFileSchema = z.object({
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

  levelId: z
    .string()
    .uuid()
    .optional(),

  changeSummary: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  generatedByAi: z
    .boolean()
    .default(false),
});