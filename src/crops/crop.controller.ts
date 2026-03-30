import { Request, Response } from "express";
import {
  getCropsServices,
  getCropByIdServices,
  createCropServices,
  updateCropServices,
  deleteCropServices,
} from "./crop.service";

// GET ALL CROPS
export const getCrops = async (req: Request, res: Response) => {
  try {
    const crops = await getCropsServices();
    return res.status(200).json({
      message: "Crops fetched successfully",
      data: crops,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch crops" });
  }
};

// GET CROP BY ID
export const getCropById = async (req: Request, res: Response) => {
  const cropId = parseInt(req.params.id as string);
  if (isNaN(cropId)) {
    return res.status(400).json({ error: "Invalid crop id" });
  }

  try {
    const crop = await getCropByIdServices(cropId);
    if (!crop) {
      return res.status(404).json({ error: "Crop not found" });
    }
    return res.status(200).json({
      message: "Crop fetched successfully",
      data: crop,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch crop" });
  }
};

// CREATE CROP
export const createCrop = async (req: Request, res: Response) => {
  const { name, category, unit, cropUrl } = req.body;
  if (!name || !category || !unit || !cropUrl) {
    return res.status(400).json({ error: "name, category, unit and cropUrl are required" });
  }

  try {
    const newCrop = await createCropServices({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create crop" });
  }
};

// UPDATE CROP
export const updateCrop = async (req: Request, res: Response) => {
  const cropId = parseInt(req.params.id as string);
  const { name, category, unit, cropUrl } = req.body;

  if (isNaN(cropId)) {
    return res.status(400).json({ error: "Invalid crop id" });
  }
  if (!name && !category && !unit && !cropUrl) {
    return res.status(400).json({ error: "At least one field (name, category, unit or cropUrl) is required" });
  }

  try {
    const updated = await updateCropServices(cropId, { name, category, unit, cropUrl });
    return res.status(200).json({
      message: "Crop updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update crop" });
  }
};

// DELETE CROP
export const deleteCrop = async (req: Request, res: Response) => {
  const cropId = parseInt(req.params.id as string);
  if (isNaN(cropId)) {
    return res.status(400).json({ error: "Invalid crop id" });
  }

  try {
    const message = await deleteCropServices(cropId);
    return res.status(200).json({ message });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete crop" });
  }
};
