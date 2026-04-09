import { Request, Response } from "express";
import {
  getWeather,
  detectPlantDisease,
  getAIInsight,
} from "./external.service";

// ✅ IMPORT LISTINGS SERVICE (IMPORTANT)
import { getAllListingsServices } from "../listings/listings.service";


// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET /api/external/prices (FROM YOUR DATABASE)
// ─────────────────────────────────────────────────────────────────────────────
export const marketPrices = async (req: Request, res: Response) => {
  try {
    const listings = await getAllListingsServices();

    if (!listings || listings.length === 0) {
      return res.json({ data: [] });
    }

    const grouped: Record<string, any[]> = {};

    // Group listings by crop
    listings.forEach((l: any) => {
      if (l.status !== "ACTIVE") return;

      const cropName = l.crop?.name || "Unknown";

      if (!grouped[cropName]) grouped[cropName] = [];
      grouped[cropName].push(l);
    });

    const prices = Object.entries(grouped).map(([name, items]) => {
      const sorted = items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      const latest = sorted[0];
      const previous = sorted[1];

      const latestPrice = Number(latest.pricePerUnit);
      const prevPrice = previous ? Number(previous.pricePerUnit) : null;

      const change =
        prevPrice && prevPrice > 0
          ? Number(
              (((latestPrice - prevPrice) / prevPrice) * 100).toFixed(1)
            )
          : 0;

      const avgPrice =
        items.reduce(
          (sum, item) => sum + Number(item.pricePerUnit),
          0
        ) / items.length;

      return {
        name,
        price: Math.round(avgPrice),
        unit: latest.crop?.unit || "kg",
        location: latest.location || "Kenya",
        change,
      };
    });

    res.json({ data: prices });
  } catch (err: any) {
    console.error("marketPrices error:", err.message);
    res.status(500).json({
      error: err.message || "Failed to fetch market prices",
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET /api/external/weather
// ─────────────────────────────────────────────────────────────────────────────
export const weather = async (req: Request, res: Response) => {
  try {
    const location = (req.query.location as string) || "Nairobi";
    const days = Number(req.query.days) || 5;

    const data = await getWeather(location, days);
    res.json({ data });
  } catch (err: any) {
    console.error("weather error:", err.message);
    res.status(500).json({
      error: err.message || "Failed to fetch weather",
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ✅ POST /api/external/disease (IMPROVED ERROR HANDLING)
// ─────────────────────────────────────────────────────────────────────────────
export const diseaseDetection = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Image file is required",
      });
    }

    const results = await detectPlantDisease(
      req.file.buffer,
      req.file.mimetype
    );

    // 🟢 Normalize empty results
    if (!results || results.length === 0) {
      return res.status(200).json({
        data: [],
        message: "No disease detected",
      });
    }

    res.json({ data: results });

  } catch (err: any) {
    console.error("diseaseDetection error:", err.message);

    // 🔴 Model loading (HF 503)
    if (err.message?.toLowerCase().includes("loading")) {
      return res.status(503).json({
        error: "AI model is warming up. Try again in a few seconds.",
      });
    }

    // 🔴 Invalid response (your 410 / HTML issue)
    if (err.message?.toLowerCase().includes("invalid response")) {
      return res.status(502).json({
        error: "AI service unavailable. Please try again later.",
      });
    }

    res.status(500).json({
      error: err.message || "Disease detection failed",
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ✅ POST /api/external/ai-insight
// ─────────────────────────────────────────────────────────────────────────────
export const aiInsight = async (req: Request, res: Response) => {
  try {
    const { crop, weather, price } = req.body;

    if (!crop) {
      return res.status(400).json({
        error: "crop is required",
      });
    }

    const data = await getAIInsight(crop, weather, price);

    res.json(data);
  } catch (err: any) {
    console.error("aiInsight error:", err.message);

    res.status(500).json({
      error: err.message || "AI insight failed",
    });
  }
};