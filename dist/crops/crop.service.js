"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCropServices = exports.updateCropServices = exports.createCropServices = exports.getCropByIdServices = exports.getCropsServices = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
// GET ALL CROPS
const getCropsServices = async () => {
    return await db_1.default.query.crops.findMany();
};
exports.getCropsServices = getCropsServices;
// GET CROP BY ID
const getCropByIdServices = async (cropId) => {
    return await db_1.default.query.crops.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.crops.id, cropId),
    });
};
exports.getCropByIdServices = getCropByIdServices;
// CREATE CROP
const createCropServices = async (crop) => {
    const [created] = await db_1.default.insert(schema_1.crops).values(crop).returning();
    return created;
};
exports.createCropServices = createCropServices;
// UPDATE CROP
const updateCropServices = async (cropId, crop) => {
    const [updated] = await db_1.default
        .update(schema_1.crops)
        .set({ ...crop })
        .where((0, drizzle_orm_1.eq)(schema_1.crops.id, cropId))
        .returning();
    if (!updated)
        throw new Error("Crop not found or update failed");
    return updated;
};
exports.updateCropServices = updateCropServices;
// DELETE CROP
const deleteCropServices = async (cropId) => {
    const deleted = await db_1.default
        .delete(schema_1.crops)
        .where((0, drizzle_orm_1.eq)(schema_1.crops.id, cropId))
        .returning();
    if (deleted.length === 0)
        throw new Error("Crop not found or delete failed");
    return "Crop deleted successfully";
};
exports.deleteCropServices = deleteCropServices;
