"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessagesReadService = exports.getUserConversationsService = exports.getConversationMessagesService = exports.getOrCreateConversationService = void 0;
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
/* ─── Get or create a conversation between two users ─── */
const getOrCreateConversationService = async (userAId, userBId) => {
    const userAConvs = await db_1.default
        .select({ conversationId: schema_1.conversationParticipants.conversationId })
        .from(schema_1.conversationParticipants)
        .where((0, drizzle_orm_1.eq)(schema_1.conversationParticipants.userId, userAId));
    const userAConvIds = userAConvs.map((c) => c.conversationId);
    if (userAConvIds.length > 0) {
        const shared = await db_1.default
            .select({ conversationId: schema_1.conversationParticipants.conversationId })
            .from(schema_1.conversationParticipants)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.conversationParticipants.userId, userBId), (0, drizzle_orm_1.inArray)(schema_1.conversationParticipants.conversationId, userAConvIds)));
        if (shared.length > 0) {
            return shared[0].conversationId;
        }
    }
    const [newConv] = await db_1.default.insert(schema_1.conversations).values({}).returning();
    await db_1.default.insert(schema_1.conversationParticipants).values([
        { conversationId: newConv.id, userId: userAId },
        { conversationId: newConv.id, userId: userBId },
    ]);
    return newConv.id;
};
exports.getOrCreateConversationService = getOrCreateConversationService;
/* ─── Get messages for a conversation ─── */
const getConversationMessagesService = async (conversationId) => {
    const msgs = await db_1.default.query.messages.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId),
        with: {
            sender: {
                columns: {
                    userId: true,
                    fullName: true,
                },
            },
        },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
    return msgs;
};
exports.getConversationMessagesService = getConversationMessagesService;
/* ─── Get all conversations for a user ─── */
const getUserConversationsService = async (userId) => {
    const participantRows = await db_1.default.query.conversationParticipants.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.conversationParticipants.userId, userId),
        with: {
            conversation: {
                with: {
                    participants: {
                        with: {
                            user: {
                                columns: {
                                    userId: true,
                                    fullName: true,
                                    // avatar: true,   
                                    role: true,
                                },
                            },
                        },
                    },
                    messages: {
                        orderBy: (messages, { desc }) => [desc(messages.createdAt)],
                        limit: 1,
                    },
                },
            },
        },
    });
    // Shape the response
    return participantRows
        .map((row) => {
        const conv = row.conversation;
        const otherParticipant = conv.participants.find((p) => p.userId !== userId);
        if (!otherParticipant?.user)
            return null;
        const lastMessage = conv.messages[0] ?? null;
        const unreadCount = conv.messages.filter((m) => !m.isRead && m.senderId !== userId).length;
        return {
            id: conv.id,
            createdAt: conv.createdAt,
            otherUser: {
                userId: otherParticipant.user.userId,
                fullName: otherParticipant.user.fullName,
                // avatar: otherParticipant.user.avatar ?? null,
                role: otherParticipant.user.role ?? "USER",
            },
            lastMessage: lastMessage
                ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isRead: lastMessage.isRead,
                    senderId: lastMessage.senderId,
                }
                : null,
            unreadCount,
        };
    })
        .filter(Boolean);
};
exports.getUserConversationsService = getUserConversationsService;
/* ─── Mark all messages in a conversation as read ─── */
const markMessagesReadService = async (conversationId, userId) => {
    await db_1.default
        .update(schema_1.messages)
        .set({ isRead: true })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId), (0, drizzle_orm_1.eq)(schema_1.messages.isRead, false)));
};
exports.markMessagesReadService = markMessagesReadService;
