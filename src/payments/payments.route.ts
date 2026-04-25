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
  mpesaB2CResult,
  mpesaB2CQueue,
} from "./payments.controller";
import { bothRoleAuth } from "../middleware/AuthBearer";

export const paymentsRouter = Router();

// ── Specific routes FIRST ────────────────────────────────────
paymentsRouter.post("/mpesa/stk", bothRoleAuth, initiateMpesaPayment);
paymentsRouter.post("/mpesa/callback", mpesaCallback);
paymentsRouter.post("/mpesa/b2c/result", mpesaB2CResult);
paymentsRouter.post("/mpesa/b2c/queue", mpesaB2CQueue);
paymentsRouter.post("/stripe/intent", bothRoleAuth, initiateStripePayment);

// ── Generic routes LAST ──────────────────────────────────────
paymentsRouter.get("/", bothRoleAuth, getPayments);
paymentsRouter.get("/order/:orderId", bothRoleAuth, getPaymentsByOrder);
paymentsRouter.get("/:id", bothRoleAuth, getPaymentById);
paymentsRouter.post("/", bothRoleAuth, createPayment);
paymentsRouter.put("/:id", bothRoleAuth, updatePayment);