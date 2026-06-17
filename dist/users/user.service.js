"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserServices = exports.updateUserServices = exports.createUserServices = exports.getUserByIdServices = exports.getUsersServices = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
// --------------------------- GET ALL USERS ---------------------------
const getUsersServices = async () => {
    return await db_1.default.query.users.findMany();
};
exports.getUsersServices = getUsersServices;
// --------------------------- GET USER BY ID ---------------------------
const getUserByIdServices = async (userId) => {
    return await db_1.default.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.users.userId, userId), // ✅ schema: users.id (uuid)
    });
};
exports.getUserByIdServices = getUserByIdServices;
// --------------------------- CREATE USER ---------------------------
const createUserServices = async (user) => {
    const [created] = await db_1.default.insert(schema_1.users).values(user).returning();
    return created;
};
exports.createUserServices = createUserServices;
// --------------------------- UPDATE USER ---------------------------
const updateUserServices = async (userId, user) => {
    const [updated] = await db_1.default
        .update(schema_1.users)
        .set({
        ...user,
        updatedAt: new Date(), // ✅ keep updatedAt fresh
    })
        .where((0, drizzle_orm_1.eq)(schema_1.users.userId, userId))
        .returning();
    if (!updated)
        throw new Error("User not found or update failed");
    return updated;
};
exports.updateUserServices = updateUserServices;
// --------------------------- DELETE USER ---------------------------
const deleteUserServices = async (userId) => {
    const deleted = await db_1.default.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.userId, userId)).returning();
    if (deleted.length === 0)
        throw new Error("User not found or delete failed");
    return "User deleted successfully";
};
exports.deleteUserServices = deleteUserServices;
