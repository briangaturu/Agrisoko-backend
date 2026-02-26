import { eq } from "drizzle-orm";
import  db  from "../drizzle/db";
import { users } from "../drizzle/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";


export type TUserInsert = InferInsertModel<typeof users>;
export type TUserSelect = InferSelectModel<typeof users>;

// --------------------------- GET ALL USERS ---------------------------
export const getUsersServices = async (): Promise<TUserSelect[]> => {
  return await db.query.users.findMany();
};

// --------------------------- GET USER BY ID ---------------------------
export const getUserByIdServices = async (
  userId: string
): Promise<TUserSelect | undefined> => {
  return await db.query.users.findFirst({
    where: eq(users.userId, userId), // ✅ schema: users.id (uuid)
  });
};

// --------------------------- CREATE USER ---------------------------
export const createUserServices = async (
  user: TUserInsert
): Promise<TUserSelect> => {
  const [created] = await db.insert(users).values(user).returning();
  return created;
};

// --------------------------- UPDATE USER ---------------------------
export const updateUserServices = async (
  userId: string,
  user: Partial<TUserInsert>
): Promise<TUserSelect> => {
  const [updated] = await db
    .update(users)
    .set({
      ...user,
      updatedAt: new Date(), // ✅ keep updatedAt fresh
    })
    .where(eq(users.userId, userId))
    .returning();

  if (!updated) throw new Error("User not found or update failed");
  return updated;
};

// --------------------------- DELETE USER ---------------------------
export const deleteUserServices = async (userId: string): Promise<string> => {
  const deleted = await db.delete(users).where(eq(users.userId, userId)).returning();

  if (deleted.length === 0) throw new Error("User not found or delete failed");
  return "User deleted successfully";
};