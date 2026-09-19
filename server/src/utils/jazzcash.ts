import crypto from "crypto";

// JazzCash Mobile Wallet (MWALLET) REST API integration.
//
// IMPORTANT - read before enabling in production:
// The exact API endpoint URL, and sometimes small field requirements,
// have changed across JazzCash API versions over the years, and
// third-party blog posts disagree with each other about the current
// path. Rather than guess and silently hit a dead/wrong URL, this
// requires JAZZCASH_API_URL to be set explicitly from the URL JazzCash
// gives you in your merchant onboarding pack (it will differ for
// sandbox vs. live, and may be updated by JazzCash over time) - see
// JAZZCASH-SETUP.md in the repo root for the full checklist.
//
// The hash algorithm and the MWALLET request/response field names below
// ARE taken directly from JazzCash's own sandbox documentation
// (sandbox.jazzcash.com.pk/SandboxDocumentation), not a third party, and
// are stable across the versions that documentation covers.

interface JazzCashCredentials {
  merchantId: string;
  password: string;
  integritySalt: string;
  apiUrl: string;
  returnUrl: string;
}

export function getJazzCashCredentials(): JazzCashCredentials | null {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID;
  const password = process.env.JAZZCASH_PASSWORD;
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;
  const apiUrl = process.env.JAZZCASH_API_URL;
  const returnUrl = process.env.JAZZCASH_RETURN_URL;

  if (!merchantId || !password || !integritySalt || !apiUrl || !returnUrl) {
    return null;
  }
  return { merchantId, password, integritySalt, apiUrl, returnUrl };
}

// Per JazzCash's documented hashing scheme: take every pp_-prefixed
// field's VALUE (not the field name), sort by field name alphabetically,
// join the values with "&", prepend the Integrity Salt, then HMAC-SHA256
// the whole thing using the Integrity Salt as the key.
export function generateJazzCashHash(fields: Record<string, string>, integritySalt: string): string {
  const sortedKeys = Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== "")
    .sort();
  const valueString = sortedKeys.map((k) => fields[k]).join("&");
  const hashInput = `${integritySalt}&${valueString}`;
  return crypto.createHmac("sha256", integritySalt).update(hashInput).digest("hex");
}

export function generateTxnRefNo(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `T${stamp}${rand}`;
}

export function formatJazzCashDateTime(date: Date): string {
  // yyyyMMddHHmmss, as JazzCash's docs specify for pp_TxnDateTime/pp_TxnExpiryDateTime
  return date.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

interface MWalletRequestParams {
  txnRefNo: string;
  amountInPaisa: number;
  mobileNumber: string;
  cnic?: string;
  description: string;
}

export interface JazzCashApiResponse {
  pp_ResponseCode?: string;
  pp_ResponseMessage?: string;
  pp_TxnRefNo?: string;
  pp_RetreivalReferenceNo?: string;
  [key: string]: unknown;
}

// Calls JazzCash's Mobile Wallet (MWALLET) transaction API - the customer
// pays directly from their JazzCash mobile account balance using their
// registered mobile number, no redirect to a hosted page needed.
export async function callJazzCashMWallet(params: MWalletRequestParams): Promise<JazzCashApiResponse> {
  const creds = getJazzCashCredentials();
  if (!creds) {
    throw new Error("JazzCash is not configured. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT, JAZZCASH_API_URL and JAZZCASH_RETURN_URL.");
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour, per JazzCash's recommended window

  const fields: Record<string, string> = {
    pp_Version: "2.0",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: creds.merchantId,
    pp_SubMerchantID: "",
    pp_Password: creds.password,
    pp_BankID: "",
    pp_ProductID: "",
    pp_TxnRefNo: params.txnRefNo,
    pp_Amount: String(params.amountInPaisa),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formatJazzCashDateTime(now),
    pp_BillReference: params.txnRefNo,
    pp_Description: params.description,
    pp_TxnExpiryDateTime: formatJazzCashDateTime(expiry),
    pp_ReturnURL: creds.returnUrl,
    ppmpf_1: params.mobileNumber,
    ppmpf_2: params.cnic || "",
  };

  const secureHash = generateJazzCashHash(fields, creds.integritySalt);

  const response = await fetch(creds.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...fields, pp_SecureHash: secureHash }),
  });

  if (!response.ok) {
    throw new Error(`JazzCash API returned HTTP ${response.status}`);
  }

  return (await response.json()) as JazzCashApiResponse;
}
