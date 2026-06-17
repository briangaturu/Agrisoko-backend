"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListingServices = exports.updateListingServices = exports.createListingServices = exports.getListingByIdServices = exports.getAllListingsServices = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
// GET ALL LISTINGS
const getAllListingsServices = async () => {
    return await db_1.default.query.listings.findMany({
        with: {
            farmer: true,
            crop: true,
        },
    });
};
exports.getAllListingsServices = getAllListingsServices;
// GET LISTING BY ID
const getListingByIdServices = async (listingId) => {
    return await db_1.default.query.listings.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.listings.id, listingId),
    });
};
exports.getListingByIdServices = getListingByIdServices;
// CREATE LISTING
const createListingServices = async (listing) => {
    const [created] = await db_1.default.insert(schema_1.listings).values(listing).returning();
    return created;
};
exports.createListingServices = createListingServices;
// UPDATE LISTING
const updateListingServices = async (listingId, listing) => {
    const [updated] = await db_1.default
        .update(schema_1.listings)
        .set({ ...listing })
        .where((0, drizzle_orm_1.eq)(schema_1.listings.id, listingId))
        .returning();
    if (!updated)
        throw new Error("Listing not found or update failed");
    return updated;
};
exports.updateListingServices = updateListingServices;
// DELETE LISTING
const deleteListingServices = async (listingId) => {
    try {
        // Check if listing has existing orders
        const existingOrderItem = await db_1.default.query.orderItems.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.orderItems.listingId, listingId),
        });
        if (existingOrderItem) {
            const error = new Error("Cannot delete listing that has existing orders");
            error.code = "23503";
            throw error;
        }
        const deleted = await db_1.default
            .delete(schema_1.listings)
            .where((0, drizzle_orm_1.eq)(schema_1.listings.id, listingId))
            .returning();
        if (deleted.length === 0)
            throw new Error("Listing not found or delete failed");
        return "Listing deleted successfully";
    }
    catch (error) {
        throw error;
    }
};
exports.deleteListingServices = deleteListingServices;
