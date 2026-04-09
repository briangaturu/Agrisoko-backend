// features/ai/ai.controller.ts

import { Request, Response } from "express";
import { generateAIInsight } from "./ai.service";

export const getAIInsight = async (req: Request, res: Response) => {
  try {
    const { crop } = req.body;

    if (!crop) {
      return res.status(400).json({ message: "Crop is required" });
    }

    const insight = await generateAIInsight(crop);

    res.json(insight);
  } catch (error) {
    console.error("AI Insight Error:", error);
    res.status(500).json({ message: "Failed to generate insight" });
  }
};