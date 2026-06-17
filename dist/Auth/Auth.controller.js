"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.passwordReset = exports.loginUser = exports.createUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Auth_service_1 = require("./Auth.service");
const user_validator_1 = require("../validation/user.validator");
const GoogleMailer_1 = require("../middleware/GoogleMailer");
const user_service_1 = require("../users/user.service");
// --------------------------- HELPERS ---------------------------
const getJWTSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET is not defined!");
    return secret;
};
// --------------------------- REGISTER ---------------------------
const createUser = async (req, res) => {
    try {
        const parseResult = user_validator_1.UserValidator.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error.issues });
        }
        const userInput = parseResult.data;
        const existingUser = await (0, Auth_service_1.getUserByEmailService)(userInput.email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        const hashedPassword = await bcrypt_1.default.hash(userInput.password, 10);
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
        const newUser = await (0, Auth_service_1.createUserServices)(payloadToCreate);
        await (0, GoogleMailer_1.sendNotificationEmail)(userInput.email, "Account created — Farm Marketplace", userInput.fullName, "Your account has been created successfully.");
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.createUser = createUser;
// --------------------------- LOGIN ---------------------------
const loginUser = async (req, res) => {
    try {
        const parseResult = user_validator_1.UserLoginValidator.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error.issues });
        }
        const { email, password } = parseResult.data;
        const user = await (0, Auth_service_1.getUserByEmailService)(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }
        // CLEAN JWT PAYLOAD (NO sub, NO exp manually)
        const payload = {
            userId: user.userId,
            email: user.email,
            role: user.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, getJWTSecret(), { expiresIn: "1h" });
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.loginUser = loginUser;
// --------------------------- PASSWORD RESET EMAIL ---------------------------
const passwordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const user = await (0, Auth_service_1.getUserByEmailService)(email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.userId }, getJWTSecret(), { expiresIn: "1h" });
        const resetLink = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/reset-password/${resetToken}`;
        await (0, GoogleMailer_1.sendNotificationEmail)(email, "Password Reset", user.fullName, `Click to reset password: <a href="${resetLink}">Reset Password</a>`);
        return res.status(200).json({
            message: "Password reset email sent",
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.passwordReset = passwordReset;
// --------------------------- RESET PASSWORD ---------------------------
const updatePassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!token || typeof token !== "string") {
            return res.status(400).json({ error: "Token is required" });
        }
        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, getJWTSecret());
        const userId = decoded.userId;
        if (!userId) {
            return res.status(400).json({ error: "Invalid token payload" });
        }
        const user = await (0, user_service_1.getUserByIdServices)(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await (0, Auth_service_1.updateUserPasswordService)(user.email, hashedPassword);
        return res.status(200).json({
            message: "Password updated successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || "Invalid or expired token",
        });
    }
};
exports.updatePassword = updatePassword;
