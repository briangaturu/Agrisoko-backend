import { Router } from "express";
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
} from "./listings.controller";

export const listingsRouter = Router();

listingsRouter.get("/", getListings);
listingsRouter.get("/:id", getListingById);
listingsRouter.post("/", createListing);
listingsRouter.put("/:id", updateListing);
listingsRouter.delete("/:id", deleteListing);
