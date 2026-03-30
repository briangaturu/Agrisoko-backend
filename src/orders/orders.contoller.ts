import { Request, Response } from "express";
import {
  getOrdersService,
  getOrderByIdService,
  getOrdersByBuyerService,
  createOrderService,
  updateOrderService,
  deleteOrderService,
} from "./orders.service";

// GET ALL ORDERS
export const getOrders = async (req: Request, res: Response) => {
  try {
    const data = await getOrdersService();
    res.json({ message: "Orders fetched successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const data = await getOrderByIdService(String(req.params.id)); // ✅ String()
    if (!data) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order fetched successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET ORDERS BY BUYER
export const getOrdersByBuyer = async (req: Request, res: Response) => {
  try {
    console.log("buyerId param:", req.params.buyerId);
    const data = await getOrdersByBuyerService(String(req.params.buyerId)); // ✅ String()
    res.json({ message: "Orders fetched successfully", data });
  } catch (err: any) {
    console.error("getOrdersByBuyer error:", err.message);
    res.status(500).json({ error: err.message });
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
    res.status(201).json({ message: "Order created successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ORDER
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const data = await updateOrderService(String(req.params.id), req.body); // ✅ String()
    res.json({ message: "Order updated successfully", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE ORDER
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const message = await deleteOrderService(String(req.params.id)); // ✅ String()
    res.json({ message });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};