import { z } from "zod";

/** Shared server-side password rules for signup (and aligned login min length). */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), {
    message: "Password must include at least one letter and one number",
  });

export const emailSchema = z.string().trim().email().max(254);
