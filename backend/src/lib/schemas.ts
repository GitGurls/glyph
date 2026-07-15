import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const generateSchema = z.object({
  prompt: z.string().trim().min(3, "Prompt must be at least 3 characters").max(2000),
  model: z.enum(["image", "face-swap", "video"], { errorMap: () => ({ message: "Unknown model" }) }),
});

export const enhanceSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
});

export const collectionCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const collectionAssignSchema = z.object({
  collectionId: z.string().min(1).nullable(),
});

export const apiKeyCreateSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
});

export const checkoutSchema = z.object({
  pack: z.enum(["starter", "pro", "studio"]),
});

export const roleUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const moderationResolveSchema = z.object({
  action: z.enum(["approve", "reject"]),
});
