import { Router } from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "./notifications.controller";
import { bothRoleAuth } from "../middleware/AuthBearer";

export const notificationsRouter = Router();

notificationsRouter.get("/:userId", bothRoleAuth, getNotifications);
notificationsRouter.put("/:id/read", bothRoleAuth, markNotificationRead);
notificationsRouter.put("/:userId/read-all", bothRoleAuth, markAllNotificationsRead);
notificationsRouter.delete("/:id", bothRoleAuth, deleteNotification);