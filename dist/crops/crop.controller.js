"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCrop = exports.updateCrop = exports.createCrop = exports.getCropById = exports.getCrops = void 0;
const crop_service_1 = require("./crop.service");
// GET ALL CROPS
const getCrops = async (req, res) => {
    try {
        const crops = await (0, crop_service_1.getCropsServices)();
        return res.status(200).json({
            message: "Crops fetched successfully",
            data: crops,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || "Failed to fetch crops" });
    }
};
exports.getCrops = getCrops;
// GET CROP BY ID
const getCropById = async (req, res) => {
    const cropId = req.params.id;
    if (!cropId) {
        return res.status(400).json({ error: "Invalid crop id" });
    }
    try {
        const crop = await (0, crop_service_1.getCropByIdServices)(cropId);
        if (!crop) {
            return res.status(404).json({ error: "Crop not found" });
        }
        return res.status(200).json({
            message: "Crop fetched successfully",
            data: crop,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || "Failed to fetch crop" });
    }
};
exports.getCropById = getCropById;
// CREATE CROP
const createCrop = async (req, res) => {
    const { name, category, unit, cropUrl } = req.body;
    if (!name || !category || !unit || !cropUrl) {
        return res.status(400).json({ error: "name, category, unit and cropUrl are required" });
    }
    try {
        const newCrop = await (0, crop_service_1.createCropServices)({
            name,
            category,
            unit,
            cropUrl,
            createdAt: new Date(),
        });
        return res.status(201).json({
            message: "Crop created successfully",
            data: newCrop,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || "Failed to create crop" });
    }
};
exports.createCrop = createCrop;
// UPDATE CROP
const updateCrop = async (req, res) => {
    const cropId = req.params.id;
    const { name, category, unit, cropUrl } = req.body;
    if (!cropId) {
        return res.status(400).json({ error: "Invalid crop id" });
    }
    if (!name && !category && !unit && !cropUrl) {
        return res.status(400).json({ error: "At least one field (name, category, unit or cropUrl) is required" });
    }
    try {
        const updated = await (0, crop_service_1.updateCropServices)(cropId, { name, category, unit, cropUrl });
        return res.status(200).json({
            message: "Crop updated successfully",
            data: updated,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || "Failed to update crop" });
    }
};
exports.updateCrop = updateCrop;
// DELETE CROP
const deleteCrop = async (req, res) => {
    const cropId = req.params.id;
    if (!cropId) {
        return res.status(400).json({ error: "Invalid crop id" });
    }
    try {
        const message = await (0, crop_service_1.deleteCropServices)(cropId);
        return res.status(200).json({ message });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || "Failed to delete crop" });
    }
};
exports.deleteCrop = deleteCrop;
