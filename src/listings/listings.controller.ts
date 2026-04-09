import { Request, Response } from "express";
import {
  getAllListingsServices,
  getListingByIdServices,
  createListingServices,
  updateListingServices,
  deleteListingServices,
} from "./listings.service";

// ✅ Strong typing for params
interface Params {
  id: string;
}

// GET ALL LISTINGS
export const getListings = async (req: Request, res: Response) => {
  try {
    const list = await getAllListingsServices();
    return res.status(200).json({
      message: "Listings fetched successfully",
      data: list,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to fetch listings",
    });
  }
};

// GET LISTING BY ID
export const getListingById = async (
  req: Request<Params>,
  res: Response
) => {
  const listingId = req.params.id;

  if (!listingId) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  try {
    const listing = await getListingByIdServices(listingId);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.status(200).json({
      message: "Listing fetched successfully",
      data: listing,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to fetch listing",
    });
  }
};

// CREATE LISTING
export const createListing = async (req: Request, res: Response) => {
  const {
    farmerId,
    cropId,
    pricePerUnit,
    quantityAvailable,
    description,
    location,
    status,
  } = req.body;

  if (
    farmerId === undefined ||
    cropId === undefined ||
    pricePerUnit === undefined ||
    quantityAvailable === undefined
  ) {
    return res.status(400).json({
      error:
        "farmerId, cropId, pricePerUnit and quantityAvailable are required",
    });
  }

  try {
    const newListing = await createListingServices({
      farmerId,
      cropId,
      pricePerUnit,
      quantityAvailable,
      description,
      location,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      message: "Listing created successfully",
      data: newListing,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to create listing",
    });
  }
};

// UPDATE LISTING 
export const updateListing = async (
  req: Request<Params>,
  res: Response
) => {
  const listingId = req.params.id;

  const {
    farmerId,
    cropId,
    pricePerUnit,
    quantityAvailable,
    description,
    location,
    status,
  } = req.body;

  if (!listingId) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  if (
    farmerId === undefined &&
    cropId === undefined &&
    pricePerUnit === undefined &&
    quantityAvailable === undefined &&
    description === undefined &&
    location === undefined &&
    status === undefined
  ) {
    return res.status(400).json({
      error: "At least one field must be provided to update",
    });
  }

  try {
    const updated = await updateListingServices(listingId, {
      farmerId,
      cropId,
      pricePerUnit,
      quantityAvailable,
      description,
      location,
      status,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      message: "Listing updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to update listing",
    });
  }
};

// DELETE LISTING (✅ FIXED: removed parseInt)
export const deleteListing = async (
  req: Request<Params>,
  res: Response
) => {
  const listingId = req.params.id;

  if (!listingId) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  try {
    const message = await deleteListingServices(listingId);
    return res.status(200).json({ message });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to delete listing",
    });
  }
};