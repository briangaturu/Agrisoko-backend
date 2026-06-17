"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIInsight = exports.detectPlantDisease = exports.getWeather = exports.getMarketPrices = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
// ── ENV ────────────────────────────────────────────────────────────────────────
const readRequiredEnv = (name) => {
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
const getMarketPrices = async (market) => {
    const url = new URL("https://api.ujuzikilimo.com/api/v1/market-prices");
    url.searchParams.set("country", "KE");
    if (market)
        url.searchParams.set("market", market);
    const res = await (0, node_fetch_1.default)(url.toString(), {
        headers: {
            Authorization: `Bearer ${process.env.UJUZI_API_KEY}`,
            "Content-Type": "application/json",
        },
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`UjuziKilimo API error ${res.status}: ${err}`);
    }
    const json = (await res.json());
    const data = json?.data || json?.prices || json || [];
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No price data returned from UjuziKilimo");
    }
    const grouped = {};
    data.forEach((item) => {
        const key = item.commodity?.toLowerCase();
        if (!key)
            return;
        if (!grouped[key])
            grouped[key] = [];
        grouped[key].push(item);
    });
    const prices = Object.values(grouped).map((items) => {
        const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        const previous = sorted[1];
        const change = previous
            ? Number((((latest.price - previous.price) / previous.price) * 100).toFixed(1))
            : 0;
        return {
            name: latest.commodity,
            price: latest.price,
            unit: latest.unit || "kg",
            market: latest.market || "Nairobi",
            change,
            date: latest.date,
            currency: latest.currency || "KES",
        };
    });
    return prices;
};
exports.getMarketPrices = getMarketPrices;
// ══════════════════════════════════════════════════════════════════════════════
// 2. WEATHER — WeatherAPI.com
// ══════════════════════════════════════════════════════════════════════════════
const getWeather = async (location, days = 5) => {
    const weatherApiKey = readRequiredEnv("WEATHER_API_KEY");
    const url = new URL("https://api.weatherapi.com/v1/forecast.json");
    url.searchParams.set("key", weatherApiKey);
    url.searchParams.set("q", location);
    url.searchParams.set("days", String(days));
    url.searchParams.set("aqi", "no");
    const res = await (0, node_fetch_1.default)(url.toString());
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`WeatherAPI error ${res.status}: ${err}`);
    }
    return res.json();
};
exports.getWeather = getWeather;
// ══════════════════════════════════════════════════════════════════════════════
// 3. DISEASE DETECTION — Kindwise crop.health
// ══════════════════════════════════════════════════════════════════════════════
const detectPlantDisease = async (imageBuffer, mimeType) => {
    const kindwiseApiKey = readRequiredEnv("KINDWISE_API_KEY");
    const kindwiseApiUrl = readRequiredEnv("KINDWISE_API_URL");
    const dataUri = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let res;
    try {
        res = await (0, node_fetch_1.default)(kindwiseApiUrl, {
            method: "POST",
            headers: {
                "Api-Key": kindwiseApiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                images: [dataUri],
                latitude: Number(process.env.KINDWISE_LATITUDE || 49.207),
                longitude: Number(process.env.KINDWISE_LONGITUDE || 16.608),
                similar_images: true,
                language: "en",
            }),
            signal: controller.signal,
        });
    }
    catch (error) {
        const msg = String(error?.message || "");
        if (msg.includes("socket hang up") || msg.includes("ECONNRESET")) {
            throw new Error("Could not connect to Kindwise API (socket hang up). Verify KINDWISE_API_URL is the exact direct API endpoint and check outbound network/firewall access.");
        }
        if (error?.name === "AbortError") {
            throw new Error("Kindwise request timed out after 25 seconds. Check KINDWISE_API_URL and network connectivity.");
        }
        throw new Error(`Kindwise network error: ${msg}`);
    }
    finally {
        clearTimeout(timeout);
    }
    const contentType = res.headers.get("content-type") || "";
    const rawBody = await res.text();
    if (contentType.includes("text/html") || rawBody.trim().startsWith("<!DOCTYPE html")) {
        throw new Error("Kindwise returned HTML instead of JSON. Check KINDWISE_API_URL and use the direct API endpoint from your Kindwise dashboard.");
    }
    let json;
    try {
        json = JSON.parse(rawBody);
    }
    catch {
        throw new Error(`Unexpected Kindwise response (status ${res.status}): ${rawBody.slice(0, 250)}`);
    }
    if (!res.ok) {
        throw new Error(json?.detail || json?.message || `Kindwise API error ${res.status}: ${rawBody.slice(0, 200)}`);
    }
    const suggestions = json?.result?.disease?.suggestions ||
        json?.result?.health_assessment?.diseases ||
        json?.diseases ||
        [];
    if (!Array.isArray(suggestions)) {
        throw new Error(`Unexpected Kindwise shape: ${JSON.stringify(json).slice(0, 300)}`);
    }
    return suggestions.slice(0, 5).map((item) => {
        const label = item?.name ||
            item?.disease_details?.common_names?.[0] ||
            item?.disease_details?.scientific_name ||
            "Unknown disease";
        const score = Number(item?.probability ?? item?.confidence ?? 0);
        return { label, score };
    });
};
exports.detectPlantDisease = detectPlantDisease;
// ══════════════════════════════════════════════════════════════════════════════
// 4. AI INSIGHT — Gemini
// ══════════════════════════════════════════════════════════════════════════════
const getAIInsight = async (crop, weather, price) => {
    const groqKey = readRequiredEnv("GROQ_API_KEY");
    const response = await (0, node_fetch_1.default)("https://api.groq.com/openai/v1/chat/completions", {
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
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Groq API error ${response.status}: ${JSON.stringify(data)}`);
    }
    const text = data?.choices?.[0]?.message?.content || "";
    try {
        const clean = text.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
    }
    catch {
        return { title: "AI Insight", body: text };
    }
};
exports.getAIInsight = getAIInsight;
