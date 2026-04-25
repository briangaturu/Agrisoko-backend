import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY as string;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET as string;
const SHORTCODE = process.env.MPESA_SHORTCODE as string;
const PASSKEY = process.env.MPESA_PASSKEY as string;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL as string;
const COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE || "0.05");

// ── Get OAuth Token ──────────────────────────────────────────
export const getAccessToken = async (): Promise<string> => {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    const res = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    console.log("✅ Access token obtained");
    return res.data.access_token;
  } catch (err: any) {
    console.error("❌ getAccessToken error:", err?.response?.data || err.message);
    throw err;
  }
};

// ── Format Phone ─────────────────────────────────────────────
export const formatPhone = (phone: string): string => {
  if (phone.startsWith("0")) return `254${phone.slice(1)}`;
  if (phone.startsWith("+")) return phone.slice(1);
  return phone;
};

// ── Calculate Escrow Amounts ─────────────────────────────────
export const calculateAmounts = (totalAmount: number) => {
  const commissionAmount = parseFloat((totalAmount * COMMISSION_RATE).toFixed(2));
  const farmerAmount = parseFloat((totalAmount - commissionAmount).toFixed(2));
  return { commissionAmount, farmerAmount };
};

// ── STK Push ─────────────────────────────────────────────────
export const initiateMpesaSTKPush = async (
  phone: string,
  amount: number,
  orderId: string
) => {
  try {
    const token = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);

    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString("base64");
    const formattedPhone = formatPhone(phone);

    console.log("📤 STK Push payload:", {
      BusinessShortCode: SHORTCODE,
      Timestamp: timestamp,
      Amount: Math.round(amount),
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: `AgriSoko-${orderId}`,
    });

    const res = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: `AgriSoko-${orderId}`,
        TransactionDesc: `Payment for order ${orderId}`,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ STK Push response:", res.data);

    // Return CheckoutRequestID so we can save it on the order
    return {
      ...res.data,
      checkoutRequestId: res.data.CheckoutRequestID,
    };
  } catch (err: any) {
    console.error("❌ STK Push error:", err?.response?.data || err.message);
    throw err;
  }
};

// ── B2C Payment (Pay Farmer) ─────────────────────────────────
export const sendB2CPayment = async (
  farmerPhone: string,
  amount: number,
  orderId: string
) => {
  try {
    const token = await getAccessToken();
    const formattedPhone = formatPhone(farmerPhone);

    console.log("📤 B2C payload:", {
      Amount: Math.round(amount),
      PartyB: formattedPhone,
      Occasion: `Order-${orderId}`,
    });

    const res = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
      {
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_INITIATOR_PASSWORD,
        CommandID: "BusinessPayment",
        Amount: Math.round(amount),
        PartyA: SHORTCODE,
        PartyB: formattedPhone,
        Remarks: `Payout for order ${orderId}`,
        QueueTimeOutURL: process.env.MPESA_B2C_QUEUE_URL,
        ResultURL: process.env.MPESA_B2C_RESULT_URL,
        Occasion: `Order-${orderId}`,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ B2C response:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ B2C error:", err?.response?.data || err.message);
    throw err;
  }
};