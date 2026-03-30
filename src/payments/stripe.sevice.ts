import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Approximate KES to USD conversion (1 USD ≈ 130 KES)
const KES_TO_USD = 130;

export const createPaymentIntent = async (amountInKES: number) => {
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