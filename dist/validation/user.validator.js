"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLoginValidator = exports.UserValidator = void 0;
const v4_1 = require("zod/v4");
exports.UserValidator = v4_1.z.object({
    id: v4_1.z.string().uuid().optional(),
    fullName: v4_1.z.string().min(2).max(100).trim(),
    email: v4_1.z.string().email().max(150).trim(),
    phone: v4_1.z
        .string()
        .min(7)
        .max(20)
        .trim()
        .optional()
        .or(v4_1.z.literal("").transform(() => undefined)),
    password: v4_1.z.string().min(8).max(72).trim(),
    role: v4_1.z.enum(["FARMER", "BUYER", "ADMIN"]).optional(),
    isVerified: v4_1.z.boolean().optional(),
});
exports.UserLoginValidator = v4_1.z.object({
    email: v4_1.z.string().email().max(150).trim(),
    password: v4_1.z.string().min(8).max(72).trim(),
});
