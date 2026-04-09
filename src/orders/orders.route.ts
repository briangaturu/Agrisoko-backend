import { Router } from "express";
import {
  getOrders,
  getOrderById,
  getOrdersByBuyer,
  createOrder,
  updateOrder,
  deleteOrder,
  confirmOrderReceived
} from "./orders.contoller";
import { bothRoleAuth } from "../middleware/AuthBearer";

export const ordersRouter = Router();

ordersRouter.get("/", bothRoleAuth, getOrders);
ordersRouter.get("/buyer/:buyerId", bothRoleAuth, getOrdersByBuyer);
ordersRouter.get("/:id", bothRoleAuth, getOrderById);
ordersRouter.post("/", bothRoleAuth, createOrder);
ordersRouter.put("/:id", bothRoleAuth, updateOrder);
ordersRouter.delete("/:id", bothRoleAuth, deleteOrder);


ordersRouter.put("/:id/confirm", bothRoleAuth, confirmOrderReceived);