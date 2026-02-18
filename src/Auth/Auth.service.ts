import { eq } from "drizzle-orm";
import  db  from "../drizzle/db"; 
import { users } from "../drizzle/schema"; 
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Infer types directly from your schema
export type TUserInsert = InferInsertModel<typeof users>;
export type TUserSelect = InferSelectModel<typeof users>;

// --------------------------- CREATE USER ---------------------------
export const createUserServices = async (
  user: TUserInsert
): Promise<TUserSelect> => {
  const [createdUser] = await db.insert(users).values(user).returning();
  return createdUser;
};

// --------------------------- GET USER BY EMAIL ---------------------------
export const getUserByEmailService = async (
  userEmail: string
): Promise<TUserSelect | undefined> => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, userEmail),
  });

  return user;
};

// --------------------------- UPDATE PASSWORD ---------------------------
export const updateUserPasswordService = async (
  email: string,
  newPasswordHash: string
): Promise<string> => {
  const result = await db
    .update(users)
    .set({
      passwordHash: newPasswordHash, // ✅ correct field from your schema
      updatedAt: new Date(),
    })
    .where(eq(users.email, email))
    .returning();

  if (result.length === 0) {
    throw new Error("User not found or password update failed");
  }

  return "Password updated successfully";
};
