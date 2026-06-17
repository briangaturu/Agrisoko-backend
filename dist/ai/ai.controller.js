"use strict";
// features/ai/ai.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIInsight = void 0;
const ai_service_1 = require("./ai.service");
const getAIInsight = async (req, res) => {
    try {
        const { crop } = req.body;
        if (!crop) {
            return res.status(400).json({ message: "Crop is required" });
        }
        const insight = await (0, ai_service_1.generateAIInsight)(crop);
        res.json(insight);
    }
    catch (error) {
        console.error("AI Insight Error:", error);
        res.status(500).json({ message: "Failed to generate insight" });
    }
};
exports.getAIInsight = getAIInsight;
