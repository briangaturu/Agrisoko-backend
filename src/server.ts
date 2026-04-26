import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app";
import db from "./drizzle/db";
import { messages, conversations, conversationParticipants, orders } from "./drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import cron from "node-cron";
import { sendB2CPayment } from "./payments/mpesa.service";

const PORT = process.env.PORT || 5000;

// ── Create HTTP server ────────────────────────────────────────
const server = http.createServer(app);

// ── Attach Socket.io ──────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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

  // Join user notification room
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
      const [saved] = await db.insert(messages).values({
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
      }).returning();

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
  const existing = await db.query.conversationParticipants.findFirst({
    where: eq(conversationParticipants.userId, userAId),
    with: { conversation: { with: { participants: true } } },
  });

  if (existing) {
    const conv = existing.conversation;
    const participants = conv.participants.map((p: any) => p.userId);
    if (participants.includes(userBId)) return String(conv.id);
  }

  const [newConv] = await db.insert(conversations).values({}).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: newConv.id, userId: userAId },
    { conversationId: newConv.id, userId: userBId },
  ]);

  return String(newConv.id);
};

// ── Send notification helper ──────────────────────────────────
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
    io.to(`user_${userId}`).emit("notification", saved);
    return saved;
  } catch (err) {
    console.error("Send notification error:", err);
  }
};

// ── Auto-release cron job (runs every hour) ───────────────────
// If buyer doesn't confirm within 48hrs of delivery,
// farmer is automatically paid via B2C
cron.schedule("0 * * * *", async () => {
  console.log("⏰ Checking for auto-release orders...");

  try {
    const expiredOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.status, "DELIVERED"),
        lte(orders.autoReleaseAt!, new Date()),
        isNotNull(orders.farmerPhone),
        isNotNull(orders.farmerAmount)
      ),
    });

    console.log(`📦 Found ${expiredOrders.length} order(s) to auto-release`);

    for (const order of expiredOrders) {
      try {
        // Mark as AUTO_RELEASED
        await db
          .update(orders)
          .set({ status: "AUTO_RELEASED", updatedAt: new Date() })
          .where(eq(orders.id, order.id));

        // Pay farmer via B2C
        await sendB2CPayment(
          order.farmerPhone!,
          parseFloat(order.farmerAmount!),
          order.id
        );

        // Notify buyer
        await sendNotification(order.buyerId, {
          title: "Payment Auto-Released 💰",
          message: `You did not confirm receipt within 48 hours. KES ${order.farmerAmount} has been automatically released to the farmer.`,
          type: "PAYMENT",
          link: `/orders/${order.id}`,
        });

        console.log(`✅ Auto-released order ${order.id} → farmer ${order.farmerPhone}`);
      } catch (err: any) {
        console.error(`❌ Failed to auto-release order ${order.id}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("❌ Auto-release cron error:", err.message);
  }
});

// ── Start server ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 API is live at http://localhost:${PORT}`);
  console.log(`✨ Welcome to Agrisoko, where farmers connect without middlemen.`);
});