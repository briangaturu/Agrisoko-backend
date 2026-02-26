import { z } from "zod/v4";


export const UserValidator = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().min(2).max(100).trim(),
  email: z.string().email().max(150).trim(),
  phone: z
    .string()
    .min(7)
    .max(20)
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)), 
  password: z.string().min(8).max(72).trim(),
  role: z.enum(["FARMER", "BUYER", "ADMIN"]).optional(),
  isVerified: z.boolean().optional(),
});

export const UserLoginValidator = z.object({
  email: z.string().email().max(150).trim(),
  password: z.string().min(8).max(72).trim(),
});