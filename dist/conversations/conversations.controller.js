"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessagesRead = exports.getUserConversations = exports.getMessages = exports.startConversation = void 0;
const conversations_service_1 = require("./conversations.service");
/* ─── POST /api/conversations/start ─── */
const startConversation = async (req, res) => {
    try {
        const { userAId, userBId } = req.body;
        if (!userAId || !userBId) {
            return res.status(400).json({ message: "userAId and userBId are required" });
        }
        if (userAId === userBId) {
            return res.status(400).json({ message: "Cannot start a conversation with yourself" });
        }
        const conversationId = await (0, conversations_service_1.getOrCreateConversationService)(userAId, userBId);
        return res.status(200).json({ conversationId });
    }
    catch (err) {
        console.error("startConversation error:", err);
        return res.status(500).json({ message: "Failed to start conversation" });
    }
};
exports.startConversation = startConversation;
/* ─── GET /api/conversations/:conversationId/messages ─── */
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params; // ✅ fixed
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }
        const data = await (0, conversations_service_1.getConversationMessagesService)(conversationId); // ✅ fixed
        return res.status(200).json({ data });
    }
    catch (err) {
        console.error("getMessages error:", err);
        return res.status(500).json({ message: "Failed to fetch messages" });
    }
};
exports.getMessages = getMessages;
/* ─── GET /api/conversations/user/:userId ─── */
const getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        const data = await (0, conversations_service_1.getUserConversationsService)(userId);
        return res.status(200).json({ data });
    }
    catch (err) {
        console.error("getUserConversations error:", err);
        return res.status(500).json({ message: "Failed to fetch conversations" });
    }
};
exports.getUserConversations = getUserConversations;
/* ─── PATCH /api/conversations/:conversationId/read ─── */
const markMessagesRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;
        if (!conversationId || !userId) {
            return res.status(400).json({ message: "conversationId and userId are required" });
        }
        await (0, conversations_service_1.markMessagesReadService)(conversationId, userId);
        return res.status(200).json({ message: "Messages marked as read" });
    }
    catch (err) {
        console.error("markMessagesRead error:", err);
        return res.status(500).json({ message: "Failed to mark messages as read" });
    }
};
exports.markMessagesRead = markMessagesRead;
