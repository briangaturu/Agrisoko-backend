import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { orders, orderItems } from "../drizzle/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type TOrderInsert = InferInsertModel<typeof orders>;
export type TOrderSelect = InferSelectModel<typeof orders>;
export type TOrderItemInsert = InferInsertModel<typeof orderItems>;

// GET ALL ORDERS
export const getOrdersService = async (): Promise<TOrderSelect[]> => {
  return await db.query.orders.findMany({
    with: {
      buyer: true,
      items: {
        with: {
          listing: {
            with: {
              crop: true,
              farmer: true,
            },
          },
        },
      },
      payments: true,
    },
  });
};

// GET ORDER BY ID
export const getOrderByIdService = async (
  orderId: string // ✅ string UUID
): Promise<TOrderSelect | undefined> => {
  return await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      buyer: true,
      items: {
        with: {
          listing: {
            with: {
              crop: true,
              farmer: true,
            },
          },
        },
      },
      payments: true,
    },
  });
};

// GET ORDERS BY BUYER
export const getOrdersByBuyerService = async (
  buyerId: string // ✅ string UUID
): Promise<TOrderSelect[]> => {
  return await db.query.orders.findMany({
    where: eq(orders.buyerId, buyerId),
    with: {
      items: {
        with: {
          listing: {
            with: {
              crop: true,
              farmer: true,
            },
          },
        },
      },
      payments: true,
    },
  });
};

// CREATE ORDER
export const createOrderService = async (
  order: TOrderInsert,
  items: TOrderItemInsert[]
): Promise<TOrderSelect> => {
  const [created] = await db.insert(orders).values(order).returning();
  await db.insert(orderItems).values(
    items.map((item) => ({ ...item, orderId: created.id }))
  );
  return created;
};

// UPDATE ORDER STATUS
export const updateOrderService = async (
  orderId: string, 
  data: Partial<TOrderInsert>
): Promise<TOrderSelect> => {
  const [updated] = await db
    .update(orders)
    .set(data)
    .where(eq(orders.id, orderId))
    .returning();
  if (!updated) throw new Error("Order not found or update failed");
  return updated;
};

// DELETE ORDER
export const deleteOrderService = async (
  orderId: string // ✅ string UUID
): Promise<string> => {
  const deleted = await db
    .delete(orders)
    .where(eq(orders.id, orderId))
    .returning();
  if (deleted.length === 0) throw new Error("Order not found");
  return "Order deleted successfully";
};

export const getOrderByMpesaRequestId = async (mpesaRequestId: string) => {
  return await db.query.orders.findFirst({
    where: eq(orders.mpesaRequestId, mpesaRequestId),
  });
};

// FARMER MARKS ORDER AS DELIVERED
export const markOrderDeliveredService = async (orderId: string) => {
  const deliveredAt = new Date();
  const autoReleaseAt = new Date(deliveredAt.getTime() + 48 * 60 * 60 * 1000); // +48hrs

  const [updated] = await db
    .update(orders)
    .set({
      status: "DELIVERED",
      deliveredAt,
      autoReleaseAt,
    })
    .where(eq(orders.id, orderId))
    .returning();

  if (!updated) throw new Error("Order not found");
  return updated;
};

// BUYER CONFIRMS RECEIPT
export const confirmOrderReceivedService = async (orderId: string) => {
  const [updated] = await db
    .update(orders)
    .set({ status: "CONFIRMED", updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  if (!updated) throw new Error("Order not found");
  return updated;
};