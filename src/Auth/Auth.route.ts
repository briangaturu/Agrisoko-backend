import { Router } from "express";

import {
  createUser,
  loginUser,
  passwordReset,
  updatePassword,
} from "./Auth.controller";

export const authRouter = Router();

// Register (Create account)
authRouter.post("/register", createUser);

// Login
authRouter.post("/login", loginUser);

// Request password reset (send email link)
authRouter.post("/password-reset", passwordReset);

// Reset password using token
authRouter.put("/reset-password/:token", updatePassword);
