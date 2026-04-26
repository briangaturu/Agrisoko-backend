import { Request, Response } from "express";
import {
  getOrdersService,
  getOrderByIdService,
  getOrdersByBuyerService,
  createOrderService,
  updateOrderService,
  deleteOrderService,
  markOrderDeliveredService,
  confirmOrderReceivedService,
} from "./orders.service";
import { sendB2CPayment } from "../payments/mpesa.service";
import { sendNotification } from "../server";
import db from "../drizzle/db";
import { listings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// GET ALL ORDERS
export const getOrders = async (req: Request, res: Response) => {
  try {
    const data = await getOrdersService();
    return res.json({ message: "Orders fetched successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const data = await getOrderByIdService(String(req.params.id));
    if (!data) return res.status(404).json({ error: "Order not found" });
    return res.json({ message: "Order fetched successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ORDERS BY BUYER
export const getOrdersByBuyer = async (req: Request, res: Response) => {
  try {
    const data = await getOrdersByBuyerService(String(req.params.buyerId));
    return res.json({ message: "Orders fetched successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// CREATE ORDER
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { buyerId, totalAmount, items } = req.body;
    if (!buyerId || !totalAmount || !items?.length) {
      return res.status(400).json({ error: "buyerId, totalAmount and items are required" });
    }

    const data = await createOrderService({ buyerId, totalAmount }, items);

    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, items[0].listingId),
    });

    if (listing?.farmerId) {
      await sendNotification(listing.farmerId, {
        title: "New Order Received! 🛒",
        message: `You have a new order worth KES ${Number(totalAmount).toLocaleString()}`,
        type: "ORDER",
        link: "/farmer-dashboard/orders",
      });
    }

    return res.status(201).json({ message: "Order created successfully", data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE ORDER
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const { status, ...rest } = req.body;

    const order = await getOrderByIdService(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // ── Farmer marks order as RECEIVED ──────────────────────
    if (status === "RECEIVED") {
      if (!order.status || !["PAID", "DELIVERED"].includes(order.status)) {
        return res.status(400).json({ error: "Order must be PAID before marking as received" });
      }

      const updated = await updateOrderService(orderId, { ...rest, status });

      await sendNotification(order.buyerId, {
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

      const updated = await updateOrderService(orderId, { ...rest, status });

      await sendNotification(order.buyerId, {
        title: "Your Order Has Been Shipped 🚚",
        message: "Your order is on its way! Confirm delivery once you receive it to release payment to the farmer.",
        type: "ORDER",
        link: `/orders/${orderId}`,
      });

      return res.json({ message: "Order marked as shipped", data: updated }); // ✅ already had return
    }

    // ── Any other generic update ─────────────────────────────
    const updated = await updateOrderService(orderId, { ...rest, status });
    return res.json({ message: "Order updated successfully", data: updated }); // ✅ return added
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE ORDER
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const message = await deleteOrderService(String(req.params.id));
    return res.json({ message });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// FARMER MARKS ORDER AS DELIVERED
export const markOrderDelivered = async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const order = await getOrderByIdService(orderId);

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!order.status || !["PAID", "DELIVERED"].includes(order.status)) {
      return res.status(400).json({ error: "Order must be PAID before marking as delivered" });
    }

    const updated = await markOrderDeliveredService(orderId);

    await sendNotification(order.buyerId, {
      title: "Order Delivered 📦",
      message: `Your order has been marked as delivered. Please confirm receipt within 48 hours.`,
      type: "ORDER",
      link: `/orders/${orderId}`,
    });

    return res.json({ message: "Order marked as delivered", data: updated }); // ✅ return added
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// BUYER CONFIRMS RECEIPT → TRIGGERS B2C PAYOUT
export const confirmOrderReceived = async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const order = await getOrderByIdService(orderId);

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!order.status || !["DELIVERED", "SHIPPED"].includes(order.status)) {
      return res.status(400).json({ error: "Order must be SHIPPED or DELIVERED before confirming receipt" });
    }

    if (!order.farmerPhone || !order.farmerAmount) {
      return res.status(400).json({ error: "Farmer payment details missing" });
    }

    const updated = await confirmOrderReceivedService(orderId);

    const farmerItem = (order as any).items?.[0];
    const farmerId = farmerItem?.listing?.farmer?.userId;

    try {
      await sendB2CPayment(
        order.farmerPhone,
        parseFloat(order.farmerAmount),
        orderId
      );
    } catch (b2cErr: any) {
      console.error("⚠️ B2C payout failed:", b2cErr.message);
    }

    if (farmerId) {
      await sendNotification(farmerId, {
        title: "Payment Released 💰",
        message: `Buyer confirmed receipt. KES ${order.farmerAmount} has been sent to your M-Pesa.`,
        type: "PAYMENT",
        link: `/farmer-dashboard/orders`,
      });
    }

    await sendNotification(order.buyerId, {
      title: "Order Completed ✅",
      message: `You have confirmed receipt of your order. Thank you for using AgriSoko!`,
      type: "ORDER",
      link: `/orders/${orderId}`,
    });

    return res.json({ message: "Order confirmed and farmer payment initiated", data: updated }); // ✅ return added
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};