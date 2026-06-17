"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmOrderReceivedService = exports.markOrderDeliveredService = exports.getOrderByMpesaRequestId = exports.deleteOrderService = exports.updateOrderService = exports.createOrderService = exports.getOrdersByBuyerService = exports.getOrderByIdService = exports.getOrdersService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
// GET ALL ORDERS
const getOrdersService = async () => {
    return await db_1.default.query.orders.findMany({
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
exports.getOrdersService = getOrdersService;
// GET ORDER BY ID
const getOrderByIdService = async (orderId // ✅ string UUID
) => {
    return await db_1.default.query.orders.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.orders.id, orderId),
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
exports.getOrderByIdService = getOrderByIdService;
// GET ORDERS BY BUYER
const getOrdersByBuyerService = async (buyerId // ✅ string UUID
) => {
    return await db_1.default.query.orders.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.orders.buyerId, buyerId),
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
exports.getOrdersByBuyerService = getOrdersByBuyerService;
// CREATE ORDER
const createOrderService = async (order, items) => {
    const [created] = await db_1.default.insert(schema_1.orders).values(order).returning();
    await db_1.default.insert(schema_1.orderItems).values(items.map((item) => ({ ...item, orderId: created.id })));
    return created;
};
exports.createOrderService = createOrderService;
// UPDATE ORDER STATUS
const updateOrderService = async (orderId, data) => {
    const [updated] = await db_1.default
        .update(schema_1.orders)
        .set(data)
        .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId))
        .returning();
    if (!updated)
        throw new Error("Order not found or update failed");
    return updated;
};
exports.updateOrderService = updateOrderService;
// DELETE ORDER
const deleteOrderService = async (orderId // ✅ string UUID
) => {
    const deleted = await db_1.default
        .delete(schema_1.orders)
        .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId))
        .returning();
    if (deleted.length === 0)
        throw new Error("Order not found");
    return "Order deleted successfully";
};
exports.deleteOrderService = deleteOrderService;
const getOrderByMpesaRequestId = async (mpesaRequestId) => {
    return await db_1.default.query.orders.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.orders.mpesaRequestId, mpesaRequestId),
    });
};
exports.getOrderByMpesaRequestId = getOrderByMpesaRequestId;
// FARMER MARKS ORDER AS DELIVERED
const markOrderDeliveredService = async (orderId) => {
    const deliveredAt = new Date();
    const autoReleaseAt = new Date(deliveredAt.getTime() + 48 * 60 * 60 * 1000); // +48hrs
    const [updated] = await db_1.default
        .update(schema_1.orders)
        .set({
        status: "DELIVERED",
        deliveredAt,
        autoReleaseAt,
    })
        .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId))
        .returning();
    if (!updated)
        throw new Error("Order not found");
    return updated;
};
exports.markOrderDeliveredService = markOrderDeliveredService;
// BUYER CONFIRMS RECEIPT
const confirmOrderReceivedService = async (orderId) => {
    const [updated] = await db_1.default
        .update(schema_1.orders)
        .set({ status: "CONFIRMED", updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId))
        .returning();
    if (!updated)
        throw new Error("Order not found");
    return updated;
};
exports.confirmOrderReceivedService = confirmOrderReceivedService;
