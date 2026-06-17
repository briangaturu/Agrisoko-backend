"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListing = exports.updateListing = exports.createListing = exports.getListingById = exports.getListings = void 0;
const listings_service_1 = require("./listings.service");
// GET ALL LISTINGS
const getListings = async (req, res) => {
    try {
        const list = await (0, listings_service_1.getAllListingsServices)();
        return res.status(200).json({
            message: "Listings fetched successfully",
            data: list,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || "Failed to fetch listings",
        });
    }
};
exports.getListings = getListings;
// GET LISTING BY ID
const getListingById = async (req, res) => {
    const listingId = req.params.id;
    if (!listingId) {
        return res.status(400).json({ error: "Invalid listing id" });
    }
    try {
        const listing = await (0, listings_service_1.getListingByIdServices)(listingId);
        if (!listing) {
            return res.status(404).json({ error: "Listing not found" });
        }
        return res.status(200).json({
            message: "Listing fetched successfully",
            data: listing,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || "Failed to fetch listing",
        });
    }
};
exports.getListingById = getListingById;
// CREATE LISTING
const createListing = async (req, res) => {
    const { farmerId, cropId, pricePerUnit, quantityAvailable, description, location, status, } = req.body;
    if (farmerId === undefined ||
        cropId === undefined ||
        pricePerUnit === undefined ||
        quantityAvailable === undefined) {
        return res.status(400).json({
            error: "farmerId, cropId, pricePerUnit and quantityAvailable are required",
        });
    }
    try {
        const newListing = await (0, listings_service_1.createListingServices)({
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
    }
    catch (error) {
        return res.status(500).json({
            error: error.message || "Failed to create listing",
        });
    }
};
exports.createListing = createListing;
// UPDATE LISTING
const updateListing = async (req, res) => {
    const listingId = req.params.id;
    const { farmerId, cropId, pricePerUnit, quantityAvailable, description, location, status, } = req.body;
    if (!listingId) {
        return res.status(400).json({ error: "Invalid listing id" });
    }
    if (farmerId === undefined &&
        cropId === undefined &&
        pricePerUnit === undefined &&
        quantityAvailable === undefined &&
        description === undefined &&
        location === undefined &&
        status === undefined) {
        return res.status(400).json({
            error: "At least one field must be provided to update",
        });
    }
    try {
        const updated = await (0, listings_service_1.updateListingServices)(listingId, {
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
    }
    catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({ error: "Cannot update listing that has existing orders" });
        }
        return res.status(500).json({
            error: error.message || "Failed to update listing",
        });
    }
};
exports.updateListing = updateListing;
// DELETE LISTING
const deleteListing = async (req, res) => {
    const listingId = req.params.id;
    if (!listingId) {
        return res.status(400).json({ error: "Invalid listing id" });
    }
    try {
        const message = await (0, listings_service_1.deleteListingServices)(listingId);
        return res.status(200).json({ message });
    }
    catch (error) {
        if (error.code === "23503") {
            return res.status(409).json({ error: "Cannot delete listing that has existing orders" });
        }
        return res.status(500).json({
            error: error.message || "Failed to delete listing",
        });
    }
};
exports.deleteListing = deleteListing;
