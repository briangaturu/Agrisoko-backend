"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotifications = void 0;
const notifications_service_1 = require("./notifications.service");
// GET NOTIFICATIONS FOR USER
const getNotifications = async (req, res) => {
    try {
        const userId = String(req.params.userId);
        const data = await (0, notifications_service_1.getNotificationsByUserService)(userId);
        res.json({ message: "Notifications fetched successfully", data });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getNotifications = getNotifications;
// MARK ONE AS READ
const markNotificationRead = async (req, res) => {
    try {
        const data = await (0, notifications_service_1.markNotificationReadService)(String(req.params.id));
        res.json({ message: "Notification marked as read", data });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.markNotificationRead = markNotificationRead;
// MARK ALL AS READ
const markAllNotificationsRead = async (req, res) => {
    try {
        await (0, notifications_service_1.markAllNotificationsReadService)(String(req.params.userId));
        res.json({ message: "All notifications marked as read" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.markAllNotificationsRead = markAllNotificationsRead;
// DELETE NOTIFICATION
const deleteNotification = async (req, res) => {
    try {
        const message = await (0, notifications_service_1.deleteNotificationService)(String(req.params.id));
        res.json({ message });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteNotification = deleteNotification;
