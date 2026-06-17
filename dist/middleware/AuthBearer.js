"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bothRoleAuth = exports.buyerRoleAuth = exports.farmerRoleAuth = exports.adminRoleAuth = exports.authMiddleware = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// AUTHENTICATION MIDDLEWARE
const verifyToken = async (token, secret) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
// AUTHORIZATION MIDDLEWARE
const authMiddleware = async (req, res, next, requiredRoles) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        res.status(401).json({ error: "Authorization header is missing" });
        return;
    }
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;
    const decodedToken = await (0, exports.verifyToken)(token, process.env.JWT_SECRET);
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
exports.authMiddleware = authMiddleware;
// ✅ Updated to match your schema roles
const adminRoleAuth = async (req, res, next) => await (0, exports.authMiddleware)(req, res, next, "ADMIN");
exports.adminRoleAuth = adminRoleAuth;
const farmerRoleAuth = async (req, res, next) => await (0, exports.authMiddleware)(req, res, next, "FARMER");
exports.farmerRoleAuth = farmerRoleAuth;
const buyerRoleAuth = async (req, res, next) => await (0, exports.authMiddleware)(req, res, next, "BUYER");
exports.buyerRoleAuth = buyerRoleAuth;
const bothRoleAuth = async (req, res, next) => await (0, exports.authMiddleware)(req, res, next, "both");
exports.bothRoleAuth = bothRoleAuth;
