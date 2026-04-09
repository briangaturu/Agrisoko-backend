import { Request, Response } from "express";
import {
  getOrCreateConversationService,
  getConversationMessagesService,
  getUserConversationsService,
  markMessagesReadService,
} from "./conversations.service";

/* ─── POST /api/conversations/start ─── */
export const startConversation = async (req: Request, res: Response) => {
  try {
    const { userAId, userBId } = req.body;

    if (!userAId || !userBId) {
      return res.status(400).json({ message: "userAId and userBId are required" });
    }

    if (userAId === userBId) {
      return res.status(400).json({ message: "Cannot start a conversation with yourself" });
    }

    const conversationId = await getOrCreateConversationService(userAId, userBId);

    return res.status(200).json({ conversationId });
  } catch (err) {
    console.error("startConversation error:", err);
    return res.status(500).json({ message: "Failed to start conversation" });
  }
};

/* ─── GET /api/conversations/:conversationId/messages ─── */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params; // ✅ fixed

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const data = await getConversationMessagesService(conversationId as unknown as string); // ✅ fixed

    return res.status(200).json({ data });
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
};

/* ─── GET /api/conversations/user/:userId ─── */
export const getUserConversations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const data = await getUserConversationsService(userId as unknown as string);

    return res.status(200).json({ data });
  } catch (err) {
    console.error("getUserConversations error:", err);
    return res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

/* ─── PATCH /api/conversations/:conversationId/read ─── */
export const markMessagesRead = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({ message: "conversationId and userId are required" });
    }

    await markMessagesReadService(conversationId as unknown as string, userId as unknown as string);

    return res.status(200).json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("markMessagesRead error:", err);
    return res.status(500).json({ message: "Failed to mark messages as read" });
  }
};