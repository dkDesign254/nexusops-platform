/**
 * NexusOps — M-Pesa tRPC Router
 *
 * Integrates with the Safaricom Daraja API to initiate STK Push (Lipa Na M-Pesa Online)
 * payment requests. Used for billing plan upgrades in markets where M-Pesa is the
 * primary payment method (Kenya, Tanzania, Uganda, Rwanda, etc.).
 *
 * Daraja API flow:
 *   1. GET /oauth/v1/generate — obtain a Bearer token using Basic Auth
 *   2. POST /mpesa/stkpush/v1/processrequest — initiate STK Push
 *   3. User sees PIN prompt on their phone
 *   4. Safaricom calls MPESA_CALLBACK_URL with payment result
 *
 * ENV vars required:
 *   MPESA_CONSUMER_KEY       — from Daraja app
 *   MPESA_CONSUMER_SECRET    — from Daraja app
 *   MPESA_BUSINESS_SHORTCODE — Paybill or Till number (174379 for sandbox)
 *   MPESA_PASSKEY            — from Daraja app
 *   MPESA_CALLBACK_URL       — publicly reachable HTTPS URL for payment callbacks
 *   MPESA_SANDBOX            — "true" for sandbox, "false" for production (default: true)
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

// ─── Daraja URL helper ────────────────────────────────────────────────────────

function darajaBase(): string {
  return ENV.mpesaSandbox
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";
}

// ─── OAuth token fetch ────────────────────────────────────────────────────────

interface DarajaTokenResponse {
  access_token: string;
  expires_in: string;
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getDarajaToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  if (!ENV.mpesaConsumerKey || !ENV.mpesaConsumerSecret) {
    throw new Error("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set.");
  }

  const credentials = Buffer.from(`${ENV.mpesaConsumerKey}:${ENV.mpesaConsumerSecret}`).toString("base64");
  const res = await fetch(`${darajaBase()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[M-Pesa] OAuth failed: ${res.status} ${text}`);
  }

  const data: DarajaTokenResponse = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (parseInt(data.expires_in, 10) - 30) * 1000;
  return cachedToken;
}

// ─── STK Push helper ──────────────────────────────────────────────────────────

interface StkPushResponse {
  MerchantRequestID:  string;
  CheckoutRequestID:  string;
  ResponseCode:       string;
  ResponseDescription: string;
  CustomerMessage:    string;
}

/** Formats current timestamp as YYYYMMDDHHmmss */
function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
}

async function initiateStkPush(opts: {
  phone: string;
  amount: number;
  accountRef: string;
  description: string;
}): Promise<StkPushResponse> {
  const { phone, amount, accountRef, description } = opts;

  if (!ENV.mpesaBusinessShortcode || !ENV.mpesaPasskey) {
    throw new Error("MPESA_BUSINESS_SHORTCODE and MPESA_PASSKEY must be set.");
  }
  if (!ENV.mpesaCallbackUrl) {
    throw new Error("MPESA_CALLBACK_URL must be set to a publicly reachable HTTPS URL.");
  }

  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${ENV.mpesaBusinessShortcode}${ENV.mpesaPasskey}${timestamp}`
  ).toString("base64");

  const token = await getDarajaToken();

  const res = await fetch(`${darajaBase()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: ENV.mpesaBusinessShortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phone.replace(/^\+/, ""),  // remove leading +
      PartyB: ENV.mpesaBusinessShortcode,
      PhoneNumber: phone.replace(/^\+/, ""),
      CallBackURL: ENV.mpesaCallbackUrl,
      AccountReference: accountRef,
      TransactionDesc: description,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[M-Pesa] STK Push failed: ${res.status} ${text}`);
  }

  const data: StkPushResponse = await res.json();
  if (data.ResponseCode !== "0") {
    throw new Error(`[M-Pesa] STK Push error: ${data.ResponseDescription}`);
  }

  return data;
}

// ─── tRPC router ──────────────────────────────────────────────────────────────

export const mpesaRouter = router({
  /**
   * Initiates an M-Pesa STK Push payment request.
   * Returns the CheckoutRequestID which can be used to query status.
   */
  initiatePayment: publicProcedure
    .input(
      z.object({
        /** Phone number in international format: +254712345678 */
        phone: z.string().regex(/^\+?254\d{9}$/, "Phone must be a valid Kenyan number: +254XXXXXXXXX"),
        /** Amount in KES (minimum 1) */
        amountKes: z.number().int().min(1).max(300000),
        /** Plan slug for account reference */
        planSlug: z.string().max(12),
        /** User ID for traceability */
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { phone, amountKes, planSlug, userId } = input;
      const accountRef = `NEXUS-${planSlug.toUpperCase().slice(0, 8)}`;
      const description = `NexusOps ${planSlug} plan upgrade`;

      const result = await initiateStkPush({
        phone,
        amount: amountKes,
        accountRef,
        description,
      });

      console.log(`[M-Pesa] STK Push initiated — user=${userId ?? "anon"} amount=${amountKes}KES ref=${accountRef} checkoutId=${result.CheckoutRequestID}`);

      return {
        checkoutRequestId: result.CheckoutRequestID,
        merchantRequestId: result.MerchantRequestID,
        message: result.CustomerMessage,
      };
    }),

  /**
   * Queries the status of an STK Push transaction by CheckoutRequestID.
   * Useful for polling after the user has had time to enter their PIN.
   */
  queryStatus: publicProcedure
    .input(z.object({ checkoutRequestId: z.string() }))
    .query(async ({ input }) => {
      if (!ENV.mpesaBusinessShortcode || !ENV.mpesaPasskey) {
        throw new Error("M-Pesa is not configured on this server.");
      }

      const timestamp = getTimestamp();
      const password = Buffer.from(
        `${ENV.mpesaBusinessShortcode}${ENV.mpesaPasskey}${timestamp}`
      ).toString("base64");

      const token = await getDarajaToken();

      const res = await fetch(`${darajaBase()}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: ENV.mpesaBusinessShortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: input.checkoutRequestId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`[M-Pesa] Status query failed: ${res.status} ${text}`);
      }

      const data: { ResultCode: string; ResultDesc: string } = await res.json();
      return {
        resultCode: data.ResultCode,
        resultDesc: data.ResultDesc,
        success: data.ResultCode === "0",
      };
    }),
});
