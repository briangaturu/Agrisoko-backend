import { Router } from "express";
import multer from "multer";
import {
  marketPrices,
  weather,
  diseaseDetection,
  aiInsight,
} from "./external.controller";

const router = Router();

// multer — store image in memory (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// GET  /api/external/prices?market=Nairobi
router.get("/prices", marketPrices);

// GET  /api/external/weather?location=Nairobi&days=5
router.get("/weather", weather);

// POST /api/external/disease  (multipart/form-data, field: "image")
router.post("/disease", upload.single("image"), diseaseDetection);

// POST /api/external/ai-insight  (json: { crop, weather?, price? })
router.post("/ai-insight", aiInsight);

export default router;