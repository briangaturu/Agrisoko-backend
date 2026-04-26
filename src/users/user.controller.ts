import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  createUserServices,
  getUserByIdServices,
  getUsersServices,
  updateUserServices,
  deleteUserServices,
} from "./user.service";

// GET ALL USERS
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsersServices();
    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to fetch users",
    });
  }
};

// GET USER BY ID
export const getUserById = async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  if (!userId) {
    return res.status(400).json({ error: "Invalid User Id" });
  }

  try {
    const user = await getUserByIdServices(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to fetch user",
    });
  }
};

// CREATE USER
export const createUser = async (req: Request, res: Response) => {
  const { fullName, email, password, phone, role } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({
      error: "fullName, email, password and phone are required",
    });
  }

  const safeRole = role === "FARMER" || role === "BUYER" ? role : "BUYER";

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUserServices({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: safeRole,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error: any) {
    if (error.code === "23505") {
      const field = error.constraint?.includes("phone") ? "Phone number" : "Email";
      return res.status(409).json({ error: `${field} is already in use` });
    }
    return res.status(500).json({
      error: error.message || "Failed to create user",
    });
  }
};

// UPDATE USER
export const updateUser = async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  if (!userId) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  const { fullName, email, phone, role } = req.body;


  if (!fullName || !email || !phone) {
    return res.status(400).json({ error: "fullName, email and phone are required" });
  }

  const validRoles = ["FARMER", "BUYER", "ADMIN"];
  const safeRole = validRoles.includes(role) ? role : undefined;

 

  const payload = {
    fullName,
    email,
    phone,
    ...(safeRole && { role: safeRole }),
  };

  

  try {
    const updatedUser = await updateUserServices(userId, payload);

    console.log("updatedUser:", updatedUser);

    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    if (error.code === "23505") {
      const field = error.constraint?.includes("phone") ? "Phone number" : "Email";
      return res.status(409).json({ error: `${field} is already in use` });
    }
    return res.status(500).json({ error: error.message || "Failed to update user" });
  }
};

// DELETE USER
export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  if (!userId) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  try {
    const deletedUser = await deleteUserServices(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found or failed to delete" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete user" });
  }
};