import { Request, Response } from "express";
import {
  getNotificationsByUserService,
  markNotificationReadService,
  markAllNotificationsReadService,
  deleteNotificationService,
} from "./notifications.service";

// GET NOTIFICATIONS FOR USER
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const data = await getNotificationsByUserService(userId);
    res.json({ message: "Notifications fetched successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// MARK ONE AS READ
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const data = await markNotificationReadService(String(req.params.id));
    res.json({ message: "Notification marked as read", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// MARK ALL AS READ
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    await markAllNotificationsReadService(String(req.params.userId));
    res.json({ message: "All notifications marked as read" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE NOTIFICATION
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const message = await deleteNotificationService(String(req.params.id));
    res.json({ message });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};