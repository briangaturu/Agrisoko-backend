"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPasswordService = exports.getUserByEmailService = exports.createUserServices = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
// --------------------------- CREATE USER ---------------------------
const createUserServices = async (user) => {
    const [createdUser] = await db_1.default.insert(schema_1.users).values(user).returning();
    return createdUser;
};
exports.createUserServices = createUserServices;
// --------------------------- GET USER BY EMAIL ---------------------------
const getUserByEmailService = async (userEmail) => {
    const user = await db_1.default.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.users.email, userEmail),
    });
    return user;
};
exports.getUserByEmailService = getUserByEmailService;
// --------------------------- UPDATE PASSWORD ---------------------------
const updateUserPasswordService = async (email, newPasswordHash) => {
    const result = await db_1.default
        .update(schema_1.users)
        .set({
        password: newPasswordHash, // ✅ correct field from your schema
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
        .returning();
    if (result.length === 0) {
        throw new Error("User not found or password update failed");
    }
    return "Password updated successfully";
};
exports.updateUserPasswordService = updateUserPasswordService;
