import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { listings, orderItems } from "../drizzle/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type TListingInsert = InferInsertModel<typeof listings>;
export type TListingSelect = InferSelectModel<typeof listings>;

// GET ALL LISTINGS
export const getAllListingsServices = async (): Promise<TListingSelect[]> => {
  return await db.query.listings.findMany({
    with: {
      farmer: true,
      crop: true,
    },
  });
};

// GET LISTING BY ID
export const getListingByIdServices = async (
  listingId: string
): Promise<TListingSelect | undefined> => {
  return await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });
};

// CREATE LISTING
export const createListingServices = async (
  listing: TListingInsert
): Promise<TListingSelect> => {
  const [created] = await db.insert(listings).values(listing).returning();
  return created;
};

// UPDATE LISTING
export const updateListingServices = async (
  listingId: string,
  listing: Partial<TListingInsert>
): Promise<TListingSelect> => {
  const [updated] = await db
    .update(listings)
    .set({ ...listing })
    .where(eq(listings.id, listingId))
    .returning();

  if (!updated) throw new Error("Listing not found or update failed");
  return updated;
};

// DELETE LISTING
export const deleteListingServices = async (listingId: string): Promise<string> => {
  try {
    // Check if listing has existing orders
    const existingOrderItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.listingId, listingId),
    });

    if (existingOrderItem) {
      const error: any = new Error("Cannot delete listing that has existing orders");
      error.code = "23503";
      throw error;
    }

    const deleted = await db
      .delete(listings)
      .where(eq(listings.id, listingId))
      .returning();

    if (deleted.length === 0) throw new Error("Listing not found or delete failed");
    return "Listing deleted successfully";
  } catch (error: any) {
    throw error;
  }
};