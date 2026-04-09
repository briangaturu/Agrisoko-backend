import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { notifications } from "../drizzle/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type TNotificationInsert = InferInsertModel<typeof notifications>;
export type TNotificationSelect = InferSelectModel<typeof notifications>;

// GET ALL NOTIFICATIONS FOR A USER
export const getNotificationsByUserService = async (
  userId: string
): Promise<TNotificationSelect[]> => {
  return await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
  });
};

// CREATE NOTIFICATION
export const createNotificationService = async (
  notification: TNotificationInsert
): Promise<TNotificationSelect> => {
  const [created] = await db.insert(notifications).values(notification).returning();
  return created;
};

// MARK NOTIFICATION AS READ
export const markNotificationReadService = async (
  notificationId: string
): Promise<TNotificationSelect> => {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId))
    .returning();
  if (!updated) throw new Error("Notification not found");
  return updated;
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsReadService = async (
  userId: string
): Promise<void> => {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
};

// DELETE NOTIFICATION
export const deleteNotificationService = async (
  notificationId: string
): Promise<string> => {
  await db.delete(notifications).where(eq(notifications.id, notificationId));
  return "Notification deleted successfully";
};