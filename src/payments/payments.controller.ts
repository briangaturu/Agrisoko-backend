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

export const getPayments = async (req: Request, res: Response) => {
  try {
    const data = await getPaymentsService();
    res.json({ message: "Payments fetched successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const data = await getPaymentByIdService(Number(req.params.id));
    if (!data) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment fetched successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPaymentsByOrder = async (req: Request, res: Response) => {
  try {
    const data = await getPaymentsByOrderService(Number(req.params.orderId));
    res.json({ message: "Payments fetched successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, provider, amount, transactionRef } = req.body;
    if (!orderId || !provider || !amount) {
      return res.status(400).json({ error: "orderId, provider and amount are required" });
    }
    const data = await createPaymentService({ orderId, provider, amount, transactionRef });
    res.status(201).json({ message: "Payment created successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const data = await updatePaymentService(Number(req.params.id), req.body);
    res.json({ message: "Payment updated successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



// INITIATE MPESA STK PUSH
export const initiateMpesaPayment = async (req: Request, res: Response) => {
  try {
    const { phone, amount, orderId } = req.body;
    if (!phone || !amount || !orderId) {
      return res.status(400).json({ error: "phone, amount and orderId are required" });
    }
    const result = await initiateMpesaSTKPush(phone, Number(amount), orderId);
    res.json({ message: "STK Push sent successfully", data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// MPESA CALLBACK
export const mpesaCallback = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) return res.status(400).json({ error: "Invalid callback" });

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    if (resultCode === 0) {
      // Payment successful
      const metadata = stkCallback.CallbackMetadata?.Item ?? [];
      const amount = metadata.find((i: any) => i.Name === "Amount")?.Value;
      const mpesaReceiptNumber = metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;
      const phoneNumber = metadata.find((i: any) => i.Name === "PhoneNumber")?.Value;

      console.log("M-Pesa payment successful:", { amount, mpesaReceiptNumber, phoneNumber });

      // TODO: Update order status to PAID using checkoutRequestId
    } else {
      console.log("M-Pesa payment failed:", stkCallback.ResultDesc);
    }

    res.json({ message: "Callback received" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};