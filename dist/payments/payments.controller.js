"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mpesaB2CQueue = exports.mpesaB2CResult = exports.mpesaCallback = exports.initiateMpesaPayment = exports.initiateStripePayment = exports.updatePayment = exports.createPayment = exports.getPaymentsByOrder = exports.getPaymentById = exports.getPayments = void 0;
const payments_service_1 = require("./payments.service");
const mpesa_service_1 = require("./mpesa.service");
const stripe_sevice_1 = require("./stripe.sevice");
const mpesa_service_2 = require("./mpesa.service");
const orders_service_1 = require("../orders/orders.service");
const server_1 = require("../server");
const getPayments = async (req, res) => {
    try {
        const data = await (0, payments_service_1.getPaymentsService)();
        return res.json({ message: "Payments fetched successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getPayments = getPayments;
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid payment id" });
        }
        const data = await (0, payments_service_1.getPaymentByIdService)(id);
        if (!data)
            return res.status(404).json({ error: "Payment not found" });
        return res.json({ message: "Payment fetched successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getPaymentById = getPaymentById;
const getPaymentsByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (typeof orderId !== "string") {
            return res.status(400).json({ error: "Invalid order id" });
        }
        const data = await (0, payments_service_1.getPaymentsByOrderService)(orderId);
        return res.json({ message: "Payments fetched successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getPaymentsByOrder = getPaymentsByOrder;
const createPayment = async (req, res) => {
    try {
        const { orderId, provider, amount, transactionRef } = req.body;
        if (!orderId || !provider || !amount) {
            return res.status(400).json({ error: "orderId, provider and amount are required" });
        }
        const data = await (0, payments_service_1.createPaymentService)({ orderId, provider, amount, transactionRef });
        return res.status(201).json({ message: "Payment created successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.createPayment = createPayment;
const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid payment id" });
        }
        const data = await (0, payments_service_1.updatePaymentService)(id, req.body);
        return res.json({ message: "Payment updated successfully", data });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.updatePayment = updatePayment;
// CREATE PAYMENT INTENT
const initiateStripePayment = async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        if (!amount || !orderId) {
            return res.status(400).json({ error: "amount and orderId are required" });
        }
        const paymentIntent = await (0, stripe_sevice_1.createPaymentIntent)(Number(amount));
        return res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.initiateStripePayment = initiateStripePayment;
// INITIATE MPESA STK PUSH
const initiateMpesaPayment = async (req, res) => {
    try {
        const { phone, amount, orderId, farmerPhone } = req.body;
        if (!phone || !amount || !orderId || !farmerPhone) {
            return res.status(400).json({ error: "phone, amount, orderId and farmerPhone are required" });
        }
        const { commissionAmount, farmerAmount } = (0, mpesa_service_2.calculateAmounts)(Number(amount));
        const result = await (0, mpesa_service_1.initiateMpesaSTKPush)(phone, Number(amount), orderId);
        await (0, orders_service_1.updateOrderService)(orderId, {
            mpesaRequestId: result.checkoutRequestId,
            farmerPhone,
            commissionAmount: commissionAmount.toString(),
            farmerAmount: farmerAmount.toString(),
        });
        return res.json({ message: "STK Push sent successfully", data: result });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.initiateMpesaPayment = initiateMpesaPayment;
// MPESA CALLBACK
const mpesaCallback = async (req, res) => {
    try {
        console.log("🔥 CALLBACK HIT:", JSON.stringify(req.body, null, 2));
        const body = req.body;
        const stkCallback = body?.Body?.stkCallback;
        if (!stkCallback)
            return res.status(400).json({ error: "Invalid callback" });
        const resultCode = stkCallback.ResultCode;
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        if (resultCode === 0) {
            const metadata = stkCallback.CallbackMetadata?.Item ?? [];
            const amount = metadata.find((i) => i.Name === "Amount")?.Value;
            const mpesaReceiptNumber = metadata.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
            console.log("✅ M-Pesa payment successful:", { amount, mpesaReceiptNumber, checkoutRequestId });
            const order = await (0, orders_service_1.getOrderByMpesaRequestId)(checkoutRequestId);
            if (order) {
                await (0, orders_service_1.updateOrderService)(order.id, {
                    status: "PAID",
                    mpesaReceiptNumber,
                });
                await (0, server_1.sendNotification)(order.buyerId, {
                    title: "Payment Confirmed ✅",
                    message: `Your payment of KES ${amount} has been received. Your order is now being processed.`,
                    type: "PAYMENT",
                    link: `/orders/${order.id}`,
                });
            }
        }
        else {
            console.log("❌ M-Pesa payment failed:", stkCallback.ResultDesc);
        }
        return res.json({ message: "Callback received" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.mpesaCallback = mpesaCallback;
// B2C RESULT (Farmer payout confirmation)
const mpesaB2CResult = async (req, res) => {
    try {
        const result = req.body?.Result;
        console.log("B2C Result:", JSON.stringify(result, null, 2));
        return res.json({ message: "B2C result received" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.mpesaB2CResult = mpesaB2CResult;
// B2C QUEUE TIMEOUT
const mpesaB2CQueue = async (req, res) => {
    console.log("B2C Queue Timeout:", req.body);
    return res.json({ message: "B2C queue timeout received" });
};
exports.mpesaB2CQueue = mpesaB2CQueue;
