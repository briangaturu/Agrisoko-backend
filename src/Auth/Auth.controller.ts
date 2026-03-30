import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  createUserServices,
  getUserByEmailService,
  updateUserPasswordService,
} from "./Auth.service";

import { UserLoginValidator, UserValidator } from "../validation/user.validator";
import { sendNotificationEmail } from "../middleware/googleMailer";
import { getUserByIdServices } from "../users/user.service";

// --------------------------- HELPERS ---------------------------
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET as string | undefined;
  if (!secret) throw new Error("JWT_SECRET is not defined!");
  return secret;
};

// --------------------------- CREATE USER (REGISTER) ---------------------------
export const createUser = async (req: Request, res: Response) => {
  try {
    const parseResult = UserValidator.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues });
    }

    /**
     * Expected fields for YOUR schema:
     * fullName, email, phone?, password, role?
     */
    const userInput = parseResult.data;

    const existingUser = await getUserByEmailService(userInput.email);
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(userInput.password, 10);

    // Map to your schema fields
    const payloadToCreate = {
      fullName: userInput.fullName,
      email: userInput.email,
      phone: userInput.phone ?? null,
      password: hashedPassword,
      role: userInput.role ?? "BUYER", // FARMER | BUYER | ADMIN
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newUser = await createUserServices(payloadToCreate);

    // optional welcome email
    await sendNotificationEmail(
      userInput.email,
      "Account created — Farm Marketplace",
      userInput.fullName,
      "Your account has been created successfully. You can now login and start using the marketplace."
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
    return res.status(500).json({ error: error.message || "Failed to create user" });
  }
};

// --------------------------- LOGIN USER ---------------------------
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

    // if you want to enforce email verification
    // if (user.isVerified === false) {
    //   return res.status(403).json({ error: "Please verify your email first" });
    // }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // ✅ include role in token payload
    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role, // ✅ ADD THIS
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    const token = jwt.sign(payload, getJWTSecret());

    // ✅ return role (and fullName/phone if you want)
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role, // ✅ ADD THIS
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to login user" });
  }
};

// --------------------------- PASSWORD RESET (EMAIL LINK) ---------------------------
export const passwordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await getUserByEmailService(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    // token contains userId in `sub`
    const resetToken = jwt.sign({ sub: user.userId }, getJWTSecret(), { expiresIn: "1h" });

    const resetLink = `${
      process.env.FRONTEND_URL ?? "http://localhost:3000"
    }/reset-password/${resetToken}`;

    const results = await sendNotificationEmail(
      email,
      "Password Reset — Farm Marketplace",
      user.fullName,
      `Click the link to reset your password: <a href="${resetLink}">Reset Password</a>`
    );

    if (!results) return res.status(500).json({ error: "Failed to send reset email" });

    return res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to reset password" });
  }
};

// --------------------------- UPDATE PASSWORD (USING RESET TOKEN) ---------------------------
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) return res.status(400).json({ error: "Token is required" });
    if (!password) return res.status(400).json({ error: "Password is required" });

    const payload = jwt.verify(token, getJWTSecret()) as any;

    // support both { sub: ... } and { userId: ... }
    const userId: string | undefined = payload.sub ?? payload.userId;
    if (!userId) return res.status(400).json({ error: "Invalid token payload" });

    const user = await getUserByIdServices(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await updateUserPasswordService(user.email, hashedPassword);

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Invalid or expired token" });
  }
};