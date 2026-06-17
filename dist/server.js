"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.getOrCreateConversation = void 0;
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./drizzle/db"));
const schema_1 = require("./drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const node_cron_1 = __importDefault(require("node-cron"));
const mpesa_service_1 = require("./payments/mpesa.service");
const PORT = process.env.PORT || 5000;
// ── Create HTTP server ────────────────────────────────────────
const server = http_1.default.createServer(app_1.default);
// ── Attach Socket.io ──────────────────────────────────────────
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});
// ── Socket.io logic ───────────────────────────────────────────
io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    // Join a conversation room
    socket.on("join_room", (conversationId) => {
        socket.join(conversationId);
        console.log(`User joined room: ${conversationId}`);
    });
    // Join user notification room
    socket.on("join_user_room", (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their notification room`);
    });
    // Send a message
    socket.on("send_message", async (data) => {
        try {
            const [saved] = await db_1.default.insert(schema_1.messages).values({
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
        }
        catch (err) {
            console.error("Message save error:", err);
            socket.emit("error", { message: "Failed to send message" });
        }
    });
    // Mark messages as read
    socket.on("mark_read", async (conversationId) => {
        try {
            await db_1.default.update(schema_1.messages)
                .set({ isRead: true })
                .where((0, drizzle_orm_1.eq)(schema_1.messages.conversationId, conversationId));
        }
        catch (err) {
            console.error("Mark read error:", err);
        }
    });
    socket.on("disconnect", () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
    });
});
// ── Helper to get or create a conversation ────────────────────
const getOrCreateConversation = async (userAId, userBId) => {
    const existing = await db_1.default.query.conversationParticipants.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.conversationParticipants.userId, userAId),
        with: { conversation: { with: { participants: true } } },
    });
    if (existing) {
        const conv = existing.conversation;
        const participants = conv.participants.map((p) => p.userId);
        if (participants.includes(userBId))
            return String(conv.id);
    }
    const [newConv] = await db_1.default.insert(schema_1.conversations).values({}).returning();
    await db_1.default.insert(schema_1.conversationParticipants).values([
        { conversationId: newConv.id, userId: userAId },
        { conversationId: newConv.id, userId: userBId },
    ]);
    return String(newConv.id);
};
exports.getOrCreateConversation = getOrCreateConversation;
// ── Send notification helper ──────────────────────────────────
const sendNotification = async (userId, notification) => {
    try {
        const { createNotificationService } = await import("./notifications/notifications.service.js");
        const saved = await createNotificationService({
            userId,
            ...notification,
        });
        io.to(`user_${userId}`).emit("notification", saved);
        return saved;
    }
    catch (err) {
        console.error("Send notification error:", err);
    }
};
exports.sendNotification = sendNotification;
// ── Auto-release cron job (runs every hour) ───────────────────
// If buyer doesn't confirm within 48hrs of delivery,
// farmer is automatically paid via B2C
node_cron_1.default.schedule("0 * * * *", async () => {
    console.log("⏰ Checking for auto-release orders...");
    try {
        const expiredOrders = await db_1.default.query.orders.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.status, "DELIVERED"), (0, drizzle_orm_1.lte)(schema_1.orders.autoReleaseAt, new Date()), (0, drizzle_orm_1.isNotNull)(schema_1.orders.farmerPhone), (0, drizzle_orm_1.isNotNull)(schema_1.orders.farmerAmount)),
        });
        console.log(`📦 Found ${expiredOrders.length} order(s) to auto-release`);
        for (const order of expiredOrders) {
            try {
                // Mark as AUTO_RELEASED
                await db_1.default
                    .update(schema_1.orders)
                    .set({ status: "AUTO_RELEASED", updatedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema_1.orders.id, order.id));
                // Pay farmer via B2C
                await (0, mpesa_service_1.sendB2CPayment)(order.farmerPhone, parseFloat(order.farmerAmount), order.id);
                // Notify buyer
                await (0, exports.sendNotification)(order.buyerId, {
                    title: "Payment Auto-Released 💰",
                    message: `You did not confirm receipt within 48 hours. KES ${order.farmerAmount} has been automatically released to the farmer.`,
                    type: "PAYMENT",
                    link: `/orders/${order.id}`,
                });
                console.log(`✅ Auto-released order ${order.id} → farmer ${order.farmerPhone}`);
            }
            catch (err) {
                console.error(`❌ Failed to auto-release order ${order.id}:`, err.message);
            }
        }
    }
    catch (err) {
        console.error("❌ Auto-release cron error:", err.message);
    }
});
// ── Start server ──────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`🚀 API is live at http://localhost:${PORT}`);
    console.log(`✨ Welcome to Agrisoko, where farmers connect without middlemen.`);
});
