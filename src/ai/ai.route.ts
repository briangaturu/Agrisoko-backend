// features/ai/ai.route.ts

import { Router } from "express";
import { getAIInsight } from "./ai.controller";

const router = Router();

router.post("/ai-insight", getAIInsight);

export default router;