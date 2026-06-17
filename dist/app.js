"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const user_route_1 = require("./users/user.route");
const Auth_route_1 = require("./Auth/Auth.route");
const crop_route_1 = require("./crops/crop.route");
const listings_route_1 = require("./listings/listings.route");
const orders_route_1 = require("./orders/orders.route");
const payments_route_1 = require("./payments/payments.route");
const notifications_route_1 = require("./notifications/notifications.route");
const emailjs_route_1 = require("./emailjs/emailjs.route");
const rateLimiter_1 = require("./middleware/rateLimiter");
const server_1 = require("./server");
const db_1 = __importDefault(require("./drizzle/db"));
const schema_1 = require("./drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// ─────────────────────────────────────────────
// Middleware (FIXED)
// ─────────────────────────────────────────────
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
// ✅ FIX 2: EXCLUDE M-PESA CALLBACK FROM RATE LIMITER
app.use((req, res, next) => {
    if (req.path.includes("/mpesa/callback")) {
        return next(); // bypass limiter
    }
    return (0, rateLimiter_1.rateLimiterMiddleware)(req, res, next);
});
// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
    res.send("Welcome to the Farm Marketplace API");
});
app.use("/api/users", user_route_1.userRouter);
app.use("/api/auth", Auth_route_1.authRouter);
app.use("/api/crops", crop_route_1.cropRouter);
app.use("/api/listings", listings_route_1.listingsRouter);
app.use("/api/orders", orders_route_1.ordersRouter);
app.use("/api/payments", payments_route_1.paymentsRouter);
app.use("/api/notifications", notifications_route_1.notificationsRouter);
app.use("/api/emailjs", emailjs_route_1.emailjsRouter);
app.use("/api/conversations", require("./conversations/conversations.route").default);
app.use("/api/ai-insight", require("./ai/ai.route").default);
app.use("/api/external", require("./externals/external.route").default);
// ─────────────────────────────────────────────────────────────
// Conversations
// ─────────────────────────────────────────────────────────────
// Start conversation
app.post("/api/conversations/start", async (req, res) => {
    try {
        const { userAId, userBId } = req.body;
        if (!userAId || !userBId) {
            return res.status(400).json({ error: "userAId and userBId are required" });
        }
        const conversationId = await (0, server_1.getOrCreateConversation)(userAId, userBId);
        res.json({ message: "Conversation ready", conversationId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
// Get messages
app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
        const id = req.params.id;
        const msgs = await db_1.default.query.messages.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.messages.conversationId, id),
            with: { sender: true },
            orderBy: [(0, drizzle_orm_1.asc)(schema_1.messages.createdAt)],
        });
        res.json({ message: "Messages fetched", data: msgs });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
// ─────────────────────────────────────────────────────────────
// 🤖 AI INSIGHT ROUTE (FIXED + PRODUCTION READY)
// ─────────────────────────────────────────────────────────────
app.post("/api/ai-insight", async (req, res) => {
    try {
        const { crop, weather, price } = req.body;
        // ✅ Validate input
        if (!crop) {
            return res.status(400).json({ error: "Crop is required" });
        }
        const prompt = `
You are an expert agricultural advisor in Kenya.

Crop: ${crop}
Market Price: ${price ?? "unknown"}
Weather: ${weather ?? "unknown"}

Give short, practical advice for farmers in Kenya.

Focus on:
- Whether to sell or hold
- What to do today on the farm
- One profit tip

Respond ONLY in JSON:
{
  "title": "short title (max 8 words)",
  "body": "2-3 sentences"
}
`;
        const geminiApiKey = process.env.GEMINI_API_KEY?.trim().replace(/^['"]|['"]$/g, "");
        if (!geminiApiKey) {
            throw new Error("GEMINI_API_KEY is missing. Set it in your environment.");
        }
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 500,
                },
            }),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini error:", errText);
            return res.status(500).json({ error: "AI provider failed" });
        }
        const data = await response.json();
        // ✅ Clean response
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const clean = text.replace(/```json|```/g, "").trim();
        let parsed;
        try {
            parsed = JSON.parse(clean);
        }
        catch {
            parsed = {
                title: "AI Insight",
                body: clean,
            };
        }
        res.json(parsed);
    }
    catch (err) {
        console.error("AI route error:", err.message);
        if (err.message?.includes("GEMINI_API_KEY is missing")) {
            return res.status(503).json({
                error: "AI insight is not configured on the server (missing GEMINI_API_KEY).",
            });
        }
        res.status(500).json({ error: err.message || "AI request failed" });
    }
});
// ─────────────────────────────────────────────────────────────
// Error handler (KEEP LAST)
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
exports.default = app;
