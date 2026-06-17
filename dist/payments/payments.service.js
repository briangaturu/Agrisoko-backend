"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentService = exports.createPaymentService = exports.getPaymentsByOrderService = exports.getPaymentByIdService = exports.getPaymentsService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
// GET ALL PAYMENTS
const getPaymentsService = async () => {
    return await db_1.default.query.payments.findMany({
        with: { order: true },
    });
};
exports.getPaymentsService = getPaymentsService;
// GET PAYMENT BY ID
const getPaymentByIdService = async (paymentId) => {
    return await db_1.default.query.payments.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.payments.id, paymentId),
        with: { order: true },
    });
};
exports.getPaymentByIdService = getPaymentByIdService;
// GET PAYMENTS BY ORDER
const getPaymentsByOrderService = async (orderId) => {
    return await db_1.default.query.payments.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.payments.orderId, orderId),
    });
};
exports.getPaymentsByOrderService = getPaymentsByOrderService;
// CREATE PAYMENT
const createPaymentService = async (payment) => {
    const [created] = await db_1.default.insert(schema_1.payments).values(payment).returning();
    return created;
};
exports.createPaymentService = createPaymentService;
// UPDATE PAYMENT
const updatePaymentService = async (paymentId, data) => {
    const [updated] = await db_1.default
        .update(schema_1.payments)
        .set(data)
        .where((0, drizzle_orm_1.eq)(schema_1.payments.id, paymentId))
        .returning();
    if (!updated)
        throw new Error("Payment not found or update failed");
    return updated;
};
exports.updatePaymentService = updatePaymentService;
