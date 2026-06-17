"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const external_controller_1 = require("./external.controller");
const router = (0, express_1.Router)();
// multer — store image in memory (no disk writes)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed"));
        }
    },
});
// GET  /api/external/prices?market=Nairobi
router.get("/prices", external_controller_1.marketPrices);
// GET  /api/external/weather?location=Nairobi&days=5
router.get("/weather", external_controller_1.weather);
// POST /api/external/disease  (multipart/form-data, field: "image")
router.post("/disease", upload.single("image"), external_controller_1.diseaseDetection);
// POST /api/external/ai-insight  (json: { crop, weather?, price? })
router.post("/ai-insight", external_controller_1.aiInsight);
exports.default = router;
