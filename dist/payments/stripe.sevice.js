"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = void 0;
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
// Approximate KES to USD conversion (1 USD ≈ 130 KES)
const KES_TO_USD = 130;
const createPaymentIntent = async (amountInKES) => {
    const amountInUSD = amountInKES / KES_TO_USD; // convert to USD
    const amountInCents = Math.round(amountInUSD * 100); // Stripe needs cents
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd", // ✅ use USD
        automatic_payment_methods: { enabled: true },
        metadata: { originalAmountKES: amountInKES.toString() },
    });
    return paymentIntent;
};
exports.createPaymentIntent = createPaymentIntent;
