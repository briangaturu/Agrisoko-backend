import db from "../drizzle/db";
import {
  conversations,
  conversationParticipants,
  messages,
  users,
} from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

/* ─── Get or create a conversation between two users ─── */
export const getOrCreateConversationService = async (
  userAId: string,
  userBId: string
): Promise<string> => {
  const userAConvs = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userAId));

  const userAConvIds = userAConvs.map((c) => c.conversationId);

  if (userAConvIds.length > 0) {
    const shared = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, userBId),
          inArray(conversationParticipants.conversationId, userAConvIds)
        )
      );

    if (shared.length > 0) {
      return shared[0].conversationId;
    }
  }

  const [newConv] = await db.insert(conversations).values({}).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: newConv.id, userId: userAId },
    { conversationId: newConv.id, userId: userBId },
  ]);

  return newConv.id;
};

/* ─── Get messages for a conversation ─── */
export const getConversationMessagesService = async (
  conversationId: string
) => {
  const msgs = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
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

/* ─── Get all conversations for a user ─── */
export const getUserConversationsService = async (userId: string) => {
  const participantRows = await db.query.conversationParticipants.findMany({
    where: eq(conversationParticipants.userId, userId),
    with: {
      conversation: {
        with: {
          participants: {
            with: {
              user: {
                columns: {
                  userId: true,
                  fullName: true,
                  avatar: true,   // ✅ added
                  role: true,     // ✅ added
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

      const otherParticipant = conv.participants.find(
        (p) => p.userId !== userId
      );

      if (!otherParticipant?.user) return null;

      const lastMessage = conv.messages[0] ?? null;
      const unreadCount = conv.messages.filter(
        (m) => !m.isRead && m.senderId !== userId
      ).length;

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

/* ─── Mark all messages in a conversation as read ─── */
export const markMessagesReadService = async (
  conversationId: string,
  userId: string
) => {
  await db
    .update(messages)
    .set({ isRead: true })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false)
      )
    );
};