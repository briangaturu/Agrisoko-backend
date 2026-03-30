import { Router } from "express";
import {
  getPayments,
  getPaymentById,
  getPaymentsByOrder,
  createPayment,
  updatePayment,
  initiateStripePayment,
  initiateMpesaPayment,
  mpesaCallback,
} from "./payments.controller";
import { bothRoleAuth } from "../middleware/AuthBearer";


export const paymentsRouter = Router();

paymentsRouter.get("/", bothRoleAuth, getPayments);
paymentsRouter.get("/order/:orderId", bothRoleAuth, getPaymentsByOrder);
paymentsRouter.get("/:id", bothRoleAuth, getPaymentById);
paymentsRouter.post("/", bothRoleAuth, createPayment);
paymentsRouter.put("/:id", bothRoleAuth, updatePayment);
paymentsRouter.post("/stripe/intent", bothRoleAuth, initiateStripePayment);

paymentsRouter.post("/mpesa/stk", bothRoleAuth, initiateMpesaPayment);
paymentsRouter.post("/mpesa/callback", mpesaCallback); 