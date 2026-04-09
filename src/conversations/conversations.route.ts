import { Router } from "express";
import {
  startConversation,
  getMessages,
  getUserConversations,
  markMessagesRead,
} from "./conversations.controller";
import { bothRoleAuth } from "../middleware/AuthBearer";

const conversationsRouter = Router();

// POST /api/conversations/start — get or create conversation between two users
conversationsRouter.post("/start", bothRoleAuth, startConversation);

// GET /api/conversations/user/:userId — get all conversations for a user
conversationsRouter.get("/user/:userId", bothRoleAuth, getUserConversations);

// GET /api/conversations/:conversationId/messages — get messages in a conversation
conversationsRouter.get("/:conversationId/messages", bothRoleAuth, getMessages);

// PATCH /api/conversations/:conversationId/read — mark messages as read
conversationsRouter.patch("/:conversationId/read", bothRoleAuth, markMessagesRead);

export default conversationsRouter;