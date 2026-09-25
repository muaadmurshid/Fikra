import { z } from "zod";

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Project title is required.")
    .max(100, "Project title must be at most 100 characters."),

  description: z
    .string()
    .trim()
    .min(10, "Project description must be at least 10 characters.")
    .max(5000, "Project description must be at most 5000 characters."),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Project title is required.")
      .max(100, "Project title must be at most 100 characters.")
      .optional(),

    description: z
      .string()
      .trim()
      .min(10, "Project description must be at least 10 characters.")
      .max(5000, "Project description must be at most 5000 characters.")
      .optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.description !== undefined,
    {
      message: "At least one field must be provided.",
    }
  );

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;