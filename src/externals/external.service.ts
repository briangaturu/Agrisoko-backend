import fetch from "node-fetch";
import FormData from "form-data";

// ── ENV ────────────────────────────────────────────────────────────────────────
const readRequiredEnv = (name: string): string => {
  const raw = process.env[name];
  const cleaned = raw?.trim().replace(/^['"]|['"]$/g, "");

  if (!cleaned) {
    throw new Error(`${name} is missing. Set it in your environment.`);
  }

  return cleaned;
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. MARKET PRICES — UjuziKilimo
// ══════════════════════════════════════════════════════════════════════════════
export const getMarketPrices = async (market?: string) => {
  const url = new URL("https://api.ujuzikilimo.com/api/v1/market-prices");
  url.searchParams.set("country", "KE");
  if (market) url.searchParams.set("market", market);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.UJUZI_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`UjuziKilimo API error ${res.status}: ${err}`);
  }

  const json = (await res.json()) as any;
  const data = json?.data || json?.prices || json || [];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No price data returned from UjuziKilimo");
  }

  const grouped: Record<string, any[]> = {};
  data.forEach((item: any) => {
    const key = item.commodity?.toLowerCase();
    if (!key) return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const prices = Object.values(grouped).map((items) => {
    const sorted   = [...items].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest   = sorted[0];
    const previous = sorted[1];
    const change   = previous
      ? Number((((latest.price - previous.price) / previous.price) * 100).toFixed(1))
      : 0;

    return {
      name:     latest.commodity,
      price:    latest.price,
      unit:     latest.unit || "kg",
      market:   latest.market || "Nairobi",
      change,
      date:     latest.date,
      currency: latest.currency || "KES",
    };
  });

  return prices;
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. WEATHER — WeatherAPI.com
// ══════════════════════════════════════════════════════════════════════════════
export const getWeather = async (location: string, days = 5) => {
  const weatherApiKey = readRequiredEnv("WEATHER_API_KEY");
  const url = new URL("https://api.weatherapi.com/v1/forecast.json");
  url.searchParams.set("key", weatherApiKey);
  url.searchParams.set("q", location);
  url.searchParams.set("days", String(days));
  url.searchParams.set("aqi", "no");

  const res = await fetch(url.toString());

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WeatherAPI error ${res.status}: ${err}`);
  }

  return res.json();
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. DISEASE DETECTION — Hugging Face
// ══════════════════════════════════════════════════════════════════════════════
export const detectPlantDisease = async (
  imageBuffer: Buffer,
  mimeType: string
) => {
  const hfApiKey = readRequiredEnv("HF_API_KEY");
  const res = await fetch(
    "https://router.huggingface.co/hf-inference/models/ozair/plant-disease-detection",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        "Content-Type": mimeType,
      },
      body: imageBuffer,
    }
  );

  // Always read as text first so we never crash on non-JSON
  const contentType = res.headers.get("content-type") || "";
  const rawBody     = await res.text();

  // Log for debugging — remove once confirmed working
  console.log("🔬 HF status:", res.status);
  console.log("🔬 HF content-type:", contentType);
  console.log("🔬 HF raw body:", rawBody.slice(0, 300));

  // Model warming up
  if (res.status === 503) {
    throw new Error("Model is loading. Please wait 20 seconds and try again.");
  }

  // Try to parse JSON
  let json: any;
  try {
    json = JSON.parse(rawBody);
  } catch {
    throw new Error(
      `Unexpected HuggingFace response (status ${res.status}): ${rawBody.slice(0, 200)}`
    );
  }

  if (!res.ok) {
    throw new Error(json?.error || `HuggingFace API error ${res.status}`);
  }

  if (!Array.isArray(json)) {
    throw new Error(`Unexpected response shape: ${JSON.stringify(json).slice(0, 200)}`);
  }

  return (json as Array<{ label: string; score: number }>).slice(0, 5);
};

// ══════════════════════════════════════════════════════════════════════════════
// 4. AI INSIGHT — Gemini
// ══════════════════════════════════════════════════════════════════════════════
export const getAIInsight = async (crop: string, weather?: string, price?: string) => {
  const groqKey = readRequiredEnv("GROQ_API_KEY");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: `You are an expert agricultural advisor for Kenyan farmers.

Crop: ${crop}
${price ? `Market Price: ${price}` : ""}
${weather ? `Weather: ${weather}` : ""}

Give concise, practical advice for growing and selling ${crop} in Kenya right now.
Focus on: current market conditions, best farming practices, and one key tip for maximizing profit.

Respond ONLY in JSON format (no markdown, no extra text):
{
  "title": "short punchy title (max 8 words)",
  "body": "2-3 sentences of practical advice"
}`
      }],
      max_tokens: 300,
    })
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(`Groq API error ${response.status}: ${JSON.stringify(data)}`);
  }

  const text = data?.choices?.[0]?.message?.content || "";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { title: "AI Insight", body: text };
  }
};