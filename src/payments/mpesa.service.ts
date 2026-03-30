import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY as string;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET as string;
const SHORTCODE = process.env.MPESA_SHORTCODE as string;
const PASSKEY = process.env.MPESA_PASSKEY as string;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL as string;

// ── Get OAuth Token ──────────────────────────────────────────
const getAccessToken = async (): Promise<string> => {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return res.data.access_token;
};

// ── STK Push ─────────────────────────────────────────────────
export const initiateMpesaSTKPush = async (
  phone: string,
  amount: number,
  orderId: string
) => {
  const token = await getAccessToken();

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);

  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString("base64");

  // ✅ Format phone: 0712345678 → 254712345678
  const formattedPhone = phone.startsWith("0")
    ? `254${phone.slice(1)}`
    : phone.startsWith("+")
    ? phone.slice(1)
    : phone;

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

  return res.data;
};