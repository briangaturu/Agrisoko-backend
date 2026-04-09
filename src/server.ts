import http from "http";
import { Server } from "socket.io";
import app from "./app";
import dotenv from "dotenv";
import db from "./drizzle/db";
import { messages, conversations, conversationParticipants } from "./drizzle/schema";
import { eq, and } from "drizzle-orm";

dotenv.config();

const PORT = process.env.PORT || 5000;

// ── Create HTTP server ────────────────────────────────────────
const server = http.createServer(app);

// ── Attach Socket.io ──────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ✅ your frontend URL
    methods: ["GET", "POST"],
  },
});

// ── Socket.io logic ───────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join a conversation room
  socket.on("join_room", (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // Inside io.on("connection")
socket.on("join_user_room", (userId: string) => {
  socket.join(`user_${userId}`);
  console.log(`User ${userId} joined their notification room`);
});

  // Send a message
  socket.on("send_message", async (data: {
    conversationId: string;
    senderId: string;
    content: string;
  }) => {
    try {
      // Save message to DB
      const [saved] = await db.insert(messages).values({
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
      }).returning();

      // Broadcast to everyone in the room
      io.to(data.conversationId).emit("receive_message", {
        id: saved.id,
        conversationId: saved.conversationId,
        senderId: saved.senderId,
        content: saved.content,
        createdAt: saved.createdAt,
        isRead: saved.isRead,
      });
    } catch (err) {
      console.error("Message save error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Mark messages as read
  socket.on("mark_read", async (conversationId: string) => {
    try {
      await db.update(messages)
        .set({ isRead: true })
        .where(eq(messages.conversationId, conversationId));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// ── Helper to get or create a conversation ────────────────────
export const getOrCreateConversation = async (
  userAId: string,
  userBId: string
): Promise<string> => {
  // Find existing conversation between these two users
  const existing = await db.query.conversationParticipants.findFirst({
    where: eq(conversationParticipants.userId, userAId),
    with: { conversation: { with: { participants: true } } },
  });

  if (existing) {
    const conv = existing.conversation;
    const participants = conv.participants.map((p: any) => p.userId);
    if (participants.includes(userBId)) return String(conv.id);
  }

  // Create new conversation
  const [newConv] = await db.insert(conversations).values({}).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: newConv.id, userId: userAId },
    { conversationId: newConv.id, userId: userBId },
  ]);

  

  return String(newConv.id);

  
};

export const sendNotification = async (
  userId: string,
  notification: {
    title: string;
    message: string;
    type: string;
    link?: string;
  }
) => {
  try {
    const { createNotificationService } = await import("./notifications/notifications.service");
    const saved = await createNotificationService({
      userId,
      ...notification,
    });
    // Send real-time notification to user's room
    io.to(`user_${userId}`).emit("notification", saved);
    return saved;
  } catch (err) {
    console.error("Send notification error:", err);
  }
};

// ── Start server ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 API is live at http://localhost:${PORT}`);
  console.log(`✨ Welcome to Agrisoko, where farmers connect without middlemen.`);
});