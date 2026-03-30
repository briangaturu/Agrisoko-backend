import { Router } from "express";
import {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
} from "./crop.controller";

export const cropRouter = Router();

cropRouter.get("/", getCrops);
cropRouter.get("/:id", getCropById);
cropRouter.post("/", createCrop);
cropRouter.put("/:id", updateCrop);
cropRouter.delete("/:id", deleteCrop);
