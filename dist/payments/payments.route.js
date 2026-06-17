"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const express_1 = require("express");
const payments_controller_1 = require("./payments.controller");
const AuthBearer_1 = require("../middleware/AuthBearer");
exports.paymentsRouter = (0, express_1.Router)();
// ── Specific routes FIRST ────────────────────────────────────
exports.paymentsRouter.post("/mpesa/stk", AuthBearer_1.bothRoleAuth, payments_controller_1.initiateMpesaPayment);
exports.paymentsRouter.post("/mpesa/callback", payments_controller_1.mpesaCallback);
exports.paymentsRouter.post("/mpesa/b2c/result", payments_controller_1.mpesaB2CResult);
exports.paymentsRouter.post("/mpesa/b2c/queue", payments_controller_1.mpesaB2CQueue);
exports.paymentsRouter.post("/stripe/intent", AuthBearer_1.bothRoleAuth, payments_controller_1.initiateStripePayment);
// ── Generic routes LAST ──────────────────────────────────────
exports.paymentsRouter.get("/", AuthBearer_1.bothRoleAuth, payments_controller_1.getPayments);
exports.paymentsRouter.get("/order/:orderId", AuthBearer_1.bothRoleAuth, payments_controller_1.getPaymentsByOrder);
exports.paymentsRouter.get("/:id", AuthBearer_1.bothRoleAuth, payments_controller_1.getPaymentById);
exports.paymentsRouter.post("/", AuthBearer_1.bothRoleAuth, payments_controller_1.createPayment);
exports.paymentsRouter.put("/:id", AuthBearer_1.bothRoleAuth, payments_controller_1.updatePayment);
