import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";

import { userRouter } from "./users/user.route";
import { authRouter } from "./Auth/Auth.route";
import { cropRouter } from "./crops/crop.route";
import { listingsRouter } from "./listings/listings.route";
import { ordersRouter } from "./orders/orders.route";
import { paymentsRouter } from "./payments/payments.route";
import { notificationsRouter } from "./notifications/notifications.route";

import { rateLimiterMiddleware } from "./middleware/rateLimiter";

import { getOrCreateConversation } from "./server";
import db from "./drizzle/db";
import { messages } from "./drizzle/schema";
import { eq, asc } from "drizzle-orm";

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(rateLimiterMiddleware);

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Farm Marketplace API");
});

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/crops", cropRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/conversations", require("./conversations/conversations.route").default);
app.use("/api/ai-insight", require("./ai/ai.route").default);
app.use("/api/external", require("./externals/external.route").default);
// ─────────────────────────────────────────────────────────────
// Conversations
// ─────────────────────────────────────────────────────────────

// Start conversation
app.post("/api/conversations/start", async (req: Request, res: Response) => {
  try {
    const { userAId, userBId } = req.body;

    if (!userAId || !userBId) {
      return res.status(400).json({ error: "userAId and userBId are required" });
    }

    const conversationId = await getOrCreateConversation(userAId, userBId);

    res.json({ message: "Conversation ready", conversationId });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get messages
app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const msgs = await db.query.messages.findMany({
      where: eq(messages.conversationId, id),
      with: { sender: true },
      orderBy: [asc(messages.createdAt)],
    });

    res.json({ message: "Messages fetched", data: msgs });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 🤖 AI INSIGHT ROUTE (FIXED + PRODUCTION READY)
// ─────────────────────────────────────────────────────────────
app.post("/api/ai-insight", async (req: Request, res: Response) => {
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", errText);
      return res.status(500).json({ error: "AI provider failed" });
    }

    const data = await response.json();

    // ✅ Clean response
    const text = data?.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        title: "AI Insight",
        body: clean,
      };
    }

    res.json(parsed);

  } catch (err: any) {
    console.error("AI route error:", err.message);
    res.status(500).json({ error: "AI request failed" });
  }
});

// ─────────────────────────────────────────────────────────────
// Error handler (KEEP LAST)
// ─────────────────────────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;