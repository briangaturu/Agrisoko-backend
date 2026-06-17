import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  createUserServices,
  getUserByEmailService,
  updateUserPasswordService,
} from "./Auth.service";

import { UserLoginValidator, UserValidator } from "../validation/user.validator";
import { sendNotificationEmail } from "../middleware/GoogleMailer";
import { getUserByIdServices } from "../users/user.service";

// --------------------------- JWT TYPE ---------------------------
type JwtPayload = {
  userId: string;
  email: string;
  role: string;
  exp?: number;
};

// --------------------------- HELPERS ---------------------------
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined!");
  return secret;
};

// --------------------------- REGISTER ---------------------------
export const createUser = async (req: Request, res: Response) => {
  try {
    const parseResult = UserValidator.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues });
    }

    const userInput = parseResult.data;

    const existingUser = await getUserByEmailService(userInput.email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(userInput.password, 10);

    const payloadToCreate = {
      fullName: userInput.fullName,
      email: userInput.email,
      phone: userInput.phone ?? null,
      password: hashedPassword,
      role: userInput.role ?? "BUYER",
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newUser = await createUserServices(payloadToCreate);

    await sendNotificationEmail(
      userInput.email,
      "Account created — Farm Marketplace",
      userInput.fullName,
      "Your account has been created successfully."
    );

    return res.status(201).json({
      message: "User created successfully",
      user: {
        userId: newUser.userId,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// --------------------------- LOGIN ---------------------------
export const loginUser = async (req: Request, res: Response) => {
  try {
    const parseResult = UserLoginValidator.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues });
    }

    const { email, password } = parseResult.data;

    const user = await getUserByEmailService(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // CLEAN JWT PAYLOAD (NO sub, NO exp manually)
    const payload: JwtPayload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, getJWTSecret(), { expiresIn: "1h" });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// --------------------------- PASSWORD RESET EMAIL ---------------------------
export const passwordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await getUserByEmailService(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = jwt.sign(
      { userId: user.userId },
      getJWTSecret(),
      { expiresIn: "1h" }
    );

    const resetLink = `${
      process.env.FRONTEND_URL ?? "http://localhost:3000"
    }/reset-password/${resetToken}`;

    await sendNotificationEmail(
      email,
      "Password Reset",
      user.fullName,
      `Click to reset password: <a href="${resetLink}">Reset Password</a>`
    );

    return res.status(200).json({
      message: "Password reset email sent",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// --------------------------- RESET PASSWORD ---------------------------
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Token is required" });
    }

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const decoded = jwt.verify(token, getJWTSecret()) as unknown as JwtPayload;

    const userId = decoded.userId;

    if (!userId) {
      return res.status(400).json({ error: "Invalid token payload" });
    }

    const user = await getUserByIdServices(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await updateUserPasswordService(user.email, hashedPassword);

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Invalid or expired token",
    });
  }
};