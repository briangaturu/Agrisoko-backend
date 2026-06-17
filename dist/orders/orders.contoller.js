"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmOrderReceived = exports.markOrderDelivered = exports.deleteOrder = exports.updateOrder = exports.createOrder = exports.getOrdersByBuyer = exports.getOrderById = exports.getOrders = void 0;
const orders_service_1 = require("./orders.service");
const mpesa_service_1 = require("../payments/mpesa.service");
const server_1 = require("../server");
const db_1 = __importDefault(require("../drizzle/db"));
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
// GET ALL ORDERS
const getOrders = async (req, res) => {
    try {
        const data = await (0, orders_service_1.getOrdersService)();
        return res.json({ message: "Orders fetched successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getOrders = getOrders;
// GET ORDER BY ID
const getOrderById = async (req, res) => {
    try {
        const data = await (0, orders_service_1.getOrderByIdService)(String(req.params.id));
        if (!data)
            return res.status(404).json({ error: "Order not found" });
        return res.json({ message: "Order fetched successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getOrderById = getOrderById;
// GET ORDERS BY BUYER
const getOrdersByBuyer = async (req, res) => {
    try {
        const data = await (0, orders_service_1.getOrdersByBuyerService)(String(req.params.buyerId));
        return res.json({ message: "Orders fetched successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getOrdersByBuyer = getOrdersByBuyer;
// CREATE ORDER
const createOrder = async (req, res) => {
    try {
        const { buyerId, totalAmount, items } = req.body;
        if (!buyerId || !totalAmount || !items?.length) {
            return res.status(400).json({ error: "buyerId, totalAmount and items are required" });
        }
        const data = await (0, orders_service_1.createOrderService)({ buyerId, totalAmount }, items);
        const listing = await db_1.default.query.listings.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.listings.id, items[0].listingId),
        });
        if (listing?.farmerId) {
            await (0, server_1.sendNotification)(listing.farmerId, {
                title: "New Order Received! 🛒",
                message: `You have a new order worth KES ${Number(totalAmount).toLocaleString()}`,
                type: "ORDER",
                link: "/farmer-dashboard/orders",
            });
        }
        return res.status(201).json({ message: "Order created successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.createOrder = createOrder;
// UPDATE ORDER
const updateOrder = async (req, res) => {
    try {
        const orderId = String(req.params.id);
        const { status, ...rest } = req.body;
        const order = await (0, orders_service_1.getOrderByIdService)(orderId);
        if (!order)
            return res.status(404).json({ error: "Order not found" });
        // ── Farmer marks order as RECEIVED ──────────────────────
        if (status === "RECEIVED") {
            if (!order.status || !["PAID", "DELIVERED"].includes(order.status)) {
                return res.status(400).json({ error: "Order must be PAID before marking as received" });
            }
            const updated = await (0, orders_service_1.updateOrderService)(orderId, { ...rest, status });
            await (0, server_1.sendNotification)(order.buyerId, {
                title: "Farmer Received Your Order 📦",
                message: "The farmer has acknowledged your order and is preparing it for dispatch.",
                type: "ORDER",
                link: `/orders/${orderId}`,
            });
            return res.json({ message: "Order marked as received", data: updated }); // ✅ already had return
        }
        // ── Farmer marks order as SHIPPED ───────────────────────
        if (status === "SHIPPED") {
            if (!order.status || order.status !== "RECEIVED") {
                return res.status(400).json({ error: "Order must be marked as RECEIVED before shipping" });
            }
            const updated = await (0, orders_service_1.updateOrderService)(orderId, { ...rest, status });
            await (0, server_1.sendNotification)(order.buyerId, {
                title: "Your Order Has Been Shipped 🚚",
                message: "Your order is on its way! Confirm delivery once you receive it to release payment to the farmer.",
                type: "ORDER",
                link: `/orders/${orderId}`,
            });
            return res.json({ message: "Order marked as shipped", data: updated }); // ✅ already had return
        }
        // ── Any other generic update ─────────────────────────────
        const updated = await (0, orders_service_1.updateOrderService)(orderId, { ...rest, status });
        return res.json({ message: "Order updated successfully", data: updated }); // ✅ return added
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.updateOrder = updateOrder;
// DELETE ORDER
const deleteOrder = async (req, res) => {
    try {
        const message = await (0, orders_service_1.deleteOrderService)(String(req.params.id));
        return res.json({ message });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.deleteOrder = deleteOrder;
// FARMER MARKS ORDER AS DELIVERED
const markOrderDelivered = async (req, res) => {
    try {
        const orderId = String(req.params.id);
        const order = await (0, orders_service_1.getOrderByIdService)(orderId);
        if (!order)
            return res.status(404).json({ error: "Order not found" });
        if (!order.status || !["PAID", "DELIVERED"].includes(order.status)) {
            return res.status(400).json({ error: "Order must be PAID before marking as delivered" });
        }
        const updated = await (0, orders_service_1.markOrderDeliveredService)(orderId);
        await (0, server_1.sendNotification)(order.buyerId, {
            title: "Order Delivered 📦",
            message: `Your order has been marked as delivered. Please confirm receipt within 48 hours.`,
            type: "ORDER",
            link: `/orders/${orderId}`,
        });
        return res.json({ message: "Order marked as delivered", data: updated }); // ✅ return added
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.markOrderDelivered = markOrderDelivered;
// BUYER CONFIRMS RECEIPT → TRIGGERS B2C PAYOUT
const confirmOrderReceived = async (req, res) => {
    try {
        const orderId = String(req.params.id);
        const order = await (0, orders_service_1.getOrderByIdService)(orderId);
        if (!order)
            return res.status(404).json({ error: "Order not found" });
        if (!order.status || !["DELIVERED", "SHIPPED"].includes(order.status)) {
            return res.status(400).json({ error: "Order must be SHIPPED or DELIVERED before confirming receipt" });
        }
        if (!order.farmerPhone || !order.farmerAmount) {
            return res.status(400).json({ error: "Farmer payment details missing" });
        }
        const updated = await (0, orders_service_1.confirmOrderReceivedService)(orderId);
        const farmerItem = order.items?.[0];
        const farmerId = farmerItem?.listing?.farmer?.userId;
        try {
            await (0, mpesa_service_1.sendB2CPayment)(order.farmerPhone, parseFloat(order.farmerAmount), orderId);
        }
        catch (b2cErr) {
            console.error("⚠️ B2C payout failed:", b2cErr.message);
        }
        if (farmerId) {
            await (0, server_1.sendNotification)(farmerId, {
                title: "Payment Released 💰",
                message: `Buyer confirmed receipt. KES ${order.farmerAmount} has been sent to your M-Pesa.`,
                type: "PAYMENT",
                link: `/farmer-dashboard/orders`,
            });
        }
        await (0, server_1.sendNotification)(order.buyerId, {
            title: "Order Completed ✅",
            message: `You have confirmed receipt of your order. Thank you for using AgriSoko!`,
            type: "ORDER",
            link: `/orders/${orderId}`,
        });
        return res.json({ message: "Order confirmed and farmer payment initiated", data: updated }); // ✅ return added
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.confirmOrderReceived = confirmOrderReceived;
