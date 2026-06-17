"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversations_controller_1 = require("./conversations.controller");
const AuthBearer_1 = require("../middleware/AuthBearer");
const conversationsRouter = (0, express_1.Router)();
// POST /api/conversations/start — get or create conversation between two users
conversationsRouter.post("/start", AuthBearer_1.bothRoleAuth, conversations_controller_1.startConversation);
// GET /api/conversations/user/:userId — get all conversations for a user
conversationsRouter.get("/user/:userId", AuthBearer_1.bothRoleAuth, conversations_controller_1.getUserConversations);
// GET /api/conversations/:conversationId/messages — get messages in a conversation
conversationsRouter.get("/:conversationId/messages", AuthBearer_1.bothRoleAuth, conversations_controller_1.getMessages);
// PATCH /api/conversations/:conversationId/read — mark messages as read
conversationsRouter.patch("/:conversationId/read", AuthBearer_1.bothRoleAuth, conversations_controller_1.markMessagesRead);
exports.default = conversationsRouter;
