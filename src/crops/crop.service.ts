import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { crops } from "../drizzle/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type TCropInsert = InferInsertModel<typeof crops>;
export type TCropSelect = InferSelectModel<typeof crops>;

// GET ALL CROPS
export const getCropsServices = async (): Promise<TCropSelect[]> => {
  return await db.query.crops.findMany();
};

// GET CROP BY ID
export const getCropByIdServices = async (
  cropId: string
): Promise<TCropSelect | undefined> => {
  return await db.query.crops.findFirst({
    where: eq(crops.id, cropId),
  });
};

// CREATE CROP
export const createCropServices = async (
  crop: TCropInsert
): Promise<TCropSelect> => {
  const [created] = await db.insert(crops).values(crop).returning();
  return created;
};

// UPDATE CROP
export const updateCropServices = async (
  cropId: string,
  crop: Partial<TCropInsert>
): Promise<TCropSelect> => {
  const [updated] = await db
    .update(crops)
    .set({ ...crop })
    .where(eq(crops.id, cropId))
    .returning();

  if (!updated) throw new Error("Crop not found or update failed");
  return updated;
};

// DELETE CROP
export const deleteCropServices = async (cropId: string): Promise<string> => {
  const deleted = await db
    .delete(crops)
    .where(eq(crops.id, cropId))
    .returning();

  if (deleted.length === 0) throw new Error("Crop not found or delete failed");
  return "Crop deleted successfully";
};