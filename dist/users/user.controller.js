"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_service_1 = require("./user.service");
// GET ALL USERS
const getUsers = async (req, res) => {
    try {
        const users = await (0, user_service_1.getUsersServices)();
        return res.status(200).json({
            message: "Users fetched successfully",
            data: users,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || "Failed to fetch users",
        });
    }
};
exports.getUsers = getUsers;
// GET USER BY ID
const getUserById = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ error: "Invalid User Id" });
    }
    try {
        const user = await (0, user_service_1.getUserByIdServices)(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({
            message: "User fetched successfully",
            data: user,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || "Failed to fetch user",
        });
    }
};
exports.getUserById = getUserById;
// CREATE USER
const createUser = async (req, res) => {
    const { fullName, email, password, phone, role } = req.body;
    if (!fullName || !email || !password || !phone) {
        return res.status(400).json({
            error: "fullName, email, password and phone are required",
        });
    }
    const safeRole = role === "FARMER" || role === "BUYER" ? role : "BUYER";
    try {
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await (0, user_service_1.createUserServices)({
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
    }
    catch (error) {
        if (error.code === "23505") {
            const field = error.constraint?.includes("phone") ? "Phone number" : "Email";
            return res.status(409).json({ error: `${field} is already in use` });
        }
        return res.status(500).json({
            error: error.message || "Failed to create user",
        });
    }
};
exports.createUser = createUser;
// UPDATE USER
const updateUser = async (req, res) => {
    const userId = req.params.id;
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
        const updatedUser = await (0, user_service_1.updateUserServices)(userId, payload);
        console.log("updatedUser:", updatedUser);
        return res.status(200).json({
            message: "User updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        if (error.code === "23505") {
            const field = error.constraint?.includes("phone") ? "Phone number" : "Email";
            return res.status(409).json({ error: `${field} is already in use` });
        }
        return res.status(500).json({ error: error.message || "Failed to update user" });
    }
};
exports.updateUser = updateUser;
// DELETE USER
const deleteUser = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ error: "Invalid userId" });
    }
    try {
        const deletedUser = await (0, user_service_1.deleteUserServices)(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found or failed to delete" });
        }
        return res.status(200).json({
            message: "User deleted successfully",
            data: deletedUser,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || "Failed to delete user" });
    }
};
exports.deleteUser = deleteUser;
