import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { payments } from "../drizzle/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type TPaymentInsert = InferInsertModel<typeof payments>;
export type TPaymentSelect = InferSelectModel<typeof payments>;

// GET ALL PAYMENTS
export const getPaymentsService = async (): Promise<TPaymentSelect[]> => {
  return await db.query.payments.findMany({
    with: { order: true },
  });
};

// GET PAYMENT BY ID
export const getPaymentByIdService = async (
  paymentId: number
): Promise<TPaymentSelect | undefined> => {
  return await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: { order: true },
  });
};

// GET PAYMENTS BY ORDER
export const getPaymentsByOrderService = async (
  orderId: number
): Promise<TPaymentSelect[]> => {
  return await db.query.payments.findMany({
    where: eq(payments.orderId, orderId),
  });
};

// CREATE PAYMENT
export const createPaymentService = async (
  payment: TPaymentInsert
): Promise<TPaymentSelect> => {
  const [created] = await db.insert(payments).values(payment).returning();
  return created;
};

// UPDATE PAYMENT
export const updatePaymentService = async (
  paymentId: number,
  data: Partial<TPaymentInsert>
): Promise<TPaymentSelect> => {
  const [updated] = await db
    .update(payments)
    .set(data)
    .where(eq(payments.id, paymentId))
    .returning();
  if (!updated) throw new Error("Payment not found or update failed");
  return updated;
};