"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationService = exports.markAllNotificationsReadService = exports.markNotificationReadService = exports.createNotificationService = exports.getNotificationsByUserService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
// GET ALL NOTIFICATIONS FOR A USER
const getNotificationsByUserService = async (userId) => {
    return await db_1.default.query.notifications.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId),
        orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    });
};
exports.getNotificationsByUserService = getNotificationsByUserService;
// CREATE NOTIFICATION
const createNotificationService = async (notification) => {
    const [created] = await db_1.default.insert(schema_1.notifications).values(notification).returning();
    return created;
};
exports.createNotificationService = createNotificationService;
// MARK NOTIFICATION AS READ
const markNotificationReadService = async (notificationId) => {
    const [updated] = await db_1.default
        .update(schema_1.notifications)
        .set({ isRead: true })
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, notificationId))
        .returning();
    if (!updated)
        throw new Error("Notification not found");
    return updated;
};
exports.markNotificationReadService = markNotificationReadService;
// MARK ALL NOTIFICATIONS AS READ
const markAllNotificationsReadService = async (userId) => {
    await db_1.default
        .update(schema_1.notifications)
        .set({ isRead: true })
        .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId));
};
exports.markAllNotificationsReadService = markAllNotificationsReadService;
// DELETE NOTIFICATION
const deleteNotificationService = async (notificationId) => {
    await db_1.default.delete(schema_1.notifications).where((0, drizzle_orm_1.eq)(schema_1.notifications.id, notificationId));
    return "Notification deleted successfully";
};
exports.deleteNotificationService = deleteNotificationService;
