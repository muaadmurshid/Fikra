import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .transform((value) => value.toLowerCase()),

  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be at most 30 characters.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores."
    )
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),

  displayName: z
    .string()
    .trim()
    .min(1, "Display name cannot be empty.")
    .max(50, "Display name must be at most 50 characters.")
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;