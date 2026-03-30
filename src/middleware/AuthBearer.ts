import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

type DecodedToken = {
  userId: number;
  email: string;
  role: string;
  fullName: string;
  exp: number;
};

// AUTHENTICATION MIDDLEWARE
export const verifyToken = async (token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
};

// AUTHORIZATION MIDDLEWARE
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
  requiredRoles: string
) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    res.status(401).json({ error: "Authorization header is missing" });
    return;
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  const decodedToken = await verifyToken(token, process.env.JWT_SECRET as string);

  if (!decodedToken) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const role = decodedToken?.role;

  // ✅ "both" = any authenticated user (FARMER, BUYER or ADMIN)
  if (requiredRoles === "both") {
    req.user = decodedToken;
    next();
    return;
  }

  // ✅ specific role check
  if (role === requiredRoles) {
    req.user = decodedToken;
    next();
    return;
  }

  res.status(403).json({ error: "Forbidden: You do not have permission to access this resource" });
};

// ✅ Updated to match your schema roles
export const adminRoleAuth = async (req: Request, res: Response, next: NextFunction) =>
  await authMiddleware(req, res, next, "ADMIN");
export const farmerRoleAuth = async (req: Request, res: Response, next: NextFunction) =>
  await authMiddleware(req, res, next, "FARMER");
export const buyerRoleAuth = async (req: Request, res: Response, next: NextFunction) =>
  await authMiddleware(req, res, next, "BUYER");
export const bothRoleAuth = async (req: Request, res: Response, next: NextFunction) =>
  await authMiddleware(req, res, next, "both");