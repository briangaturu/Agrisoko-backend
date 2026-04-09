import fetch from "node-fetch";
import FormData from "form-data";

// ── ENV ────────────────────────────────────────────────────────────────────────
const UJUZI_API_KEY     = process.env.UJUZI_API_KEY!;
const WEATHER_API_KEY   = process.env.WEATHER_API_KEY!;
const HF_API_KEY        = process.env.HF_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

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
  const url = new URL("https://api.weatherapi.com/v1/forecast.json");
  url.searchParams.set("key", WEATHER_API_KEY);
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
  const res = await fetch(
    "https://api-inference.huggingface.co/models/nateraw/plant-disease-classifier",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
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
// 4. AI INSIGHT — Anthropic Claude
// ══════════════════════════════════════════════════════════════════════════════
export const getAIInsight = async (
  crop: string,
  weather?: string,
  price?: string
) => {
  const prompt = `You are an expert agricultural advisor for Kenyan farmers.

Crop: ${crop}
${price   ? `Market Price: ${price}` : ""}
${weather ? `Weather: ${weather}`    : ""}

Give a concise, practical insight for growing and selling ${crop} in Kenya right now.
Focus on: current market conditions, best farming practices, and one key tip for maximizing profit.

Respond ONLY in JSON format (no markdown, no extra text):
{
  "title": "short punchy title (max 8 words)",
  "body": "2-3 sentences of practical advice"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data  = (await res.json()) as any;
  const text  = data?.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    return { title: "AI Insight", body: clean };
  }
};