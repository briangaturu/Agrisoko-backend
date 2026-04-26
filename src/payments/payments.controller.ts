import { Request, Response } from "express";
import {
  getPaymentsService,
  getPaymentByIdService,
  getPaymentsByOrderService,
  createPaymentService,
  updatePaymentService,
} from "./payments.service";
import { initiateMpesaSTKPush } from "./mpesa.service";
import { createPaymentIntent } from "./stripe.sevice";
import { calculateAmounts, sendB2CPayment } from "./mpesa.service";
import { updateOrderService, getOrderByMpesaRequestId } from "../orders/orders.service";
import { sendNotification } from "../server";

export const getPayments = async (req: Request, res: Response) => {
  try {
    const data = await getPaymentsService();
    return res.json({ message: "Payments fetched successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const data = await getPaymentByIdService(Number(req.params.id));
    if (!data) return res.status(404).json({ error: "Payment not found" });
    return res.json({ message: "Payment fetched successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPaymentsByOrder = async (req: Request, res: Response) => {
  try {
    const data = await getPaymentsByOrderService(Number(req.params.orderId));
    return res.json({ message: "Payments fetched successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, provider, amount, transactionRef } = req.body;
    if (!orderId || !provider || !amount) {
      return res.status(400).json({ error: "orderId, provider and amount are required" });
    }
    const data = await createPaymentService({ orderId, provider, amount, transactionRef });
    return res.status(201).json({ message: "Payment created successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const data = await updatePaymentService(Number(req.params.id), req.body);
    return res.json({ message: "Payment updated successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// CREATE PAYMENT INTENT
export const initiateStripePayment = async (req: Request, res: Response) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || !orderId) {
      return res.status(400).json({ error: "amount and orderId are required" });
    }

    const paymentIntent = await createPaymentIntent(Number(amount));

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// INITIATE MPESA STK PUSH
export const initiateMpesaPayment = async (req: Request, res: Response) => {
  try {
    const { phone, amount, orderId, farmerPhone } = req.body;
    if (!phone || !amount || !orderId || !farmerPhone) {
      return res.status(400).json({ error: "phone, amount, orderId and farmerPhone are required" });
    }

    const { commissionAmount, farmerAmount } = calculateAmounts(Number(amount));

    const result = await initiateMpesaSTKPush(phone, Number(amount), orderId);

    await updateOrderService(orderId, {
      mpesaRequestId: result.checkoutRequestId,
      farmerPhone,
      commissionAmount: commissionAmount.toString(),
      farmerAmount: farmerAmount.toString(),
    });

    return res.json({ message: "STK Push sent successfully", data: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// MPESA CALLBACK
export const mpesaCallback = async (req: Request, res: Response) => {
  try {
    console.log("🔥 CALLBACK HIT:", JSON.stringify(req.body, null, 2));
    const body = req.body;
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) return res.status(400).json({ error: "Invalid callback" });

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    if (resultCode === 0) {
      const metadata = stkCallback.CallbackMetadata?.Item ?? [];
      const amount = metadata.find((i: any) => i.Name === "Amount")?.Value;
      const mpesaReceiptNumber = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;

      console.log("✅ M-Pesa payment successful:", { amount, mpesaReceiptNumber, checkoutRequestId });

      const order = await getOrderByMpesaRequestId(checkoutRequestId);
      if (order) {
        await updateOrderService(order.id, {
          status: "PAID",
          mpesaReceiptNumber,
        });

        await sendNotification(order.buyerId, {
          title: "Payment Confirmed ✅",
          message: `Your payment of KES ${amount} has been received. Your order is now being processed.`,
          type: "PAYMENT",
          link: `/orders/${order.id}`,
        });
      }
    } else {
      console.log("❌ M-Pesa payment failed:", stkCallback.ResultDesc);
    }

    return res.json({ message: "Callback received" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// B2C RESULT (Farmer payout confirmation)
export const mpesaB2CResult = async (req: Request, res: Response) => {
  try {
    const result = req.body?.Result;
    console.log("B2C Result:", JSON.stringify(result, null, 2));
    return res.json({ message: "B2C result received" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// B2C QUEUE TIMEOUT
export const mpesaB2CQueue = async (req: Request, res: Response) => {
  console.log("B2C Queue Timeout:", req.body);
  return res.json({ message: "B2C queue timeout received" });
};