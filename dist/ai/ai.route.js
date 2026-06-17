"use strict";
// features/ai/ai.route.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const router = (0, express_1.Router)();
router.post("/ai-insight", ai_controller_1.getAIInsight);
exports.default = router;
