import CommunicationLog from "../models/CommunicationLog";

// SMS via Twilio. Twilio was chosen over a local Pakistani SMS reseller
// deliberately: that market is fragmented across many providers (H3
// Techs/Branded SMS Pakistan, EasySendSMS, Releans, and others) with no
// single dominant, consistently-documented API the way JazzCash or
// Meta's WhatsApp Cloud API are - guessing at one specific reseller's
// exact parameter names risked the same "confidently wrong endpoint"
// problem flagged in jazzcash.ts. Twilio is well-documented, definitely
// delivers to Pakistani numbers, and this can be swapped for a local
// reseller later using the same pattern if one is preferred - see
// MESSAGING-SETUP.md.

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export function getTwilioCredentials(): TwilioCredentials | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

async function logMessage(to: string, subject: string, status: "SENT" | "FAILED", error?: string, schoolId?: string) {
  try {
    await CommunicationLog.create({ to, subject, status, error, schoolId, channel: "SMS" });
  } catch {
    // Best-effort, same reasoning as mailer.ts's logCommunication.
  }
}

// toPhoneE164 must include the country code, e.g. +923001234567.
export async function sendSms(toPhoneE164: string, message: string, schoolId?: string): Promise<void> {
  const creds = getTwilioCredentials();
  if (!creds) {
    console.warn(`[sms] Not configured - would have sent "${message}" to ${toPhoneE164}`);
    await logMessage(toPhoneE164, message.slice(0, 60), "FAILED", "SMS not configured", schoolId);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`;
  const body = new URLSearchParams({ To: toPhoneE164, From: creds.fromNumber, Body: message });
  const basicAuth = Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = (await response.json()) as any;
    if (!response.ok) {
      const errMessage = data?.message || `HTTP ${response.status}`;
      await logMessage(toPhoneE164, message.slice(0, 60), "FAILED", errMessage, schoolId);
      throw new Error(errMessage);
    }
    await logMessage(toPhoneE164, message.slice(0, 60), "SENT", undefined, schoolId);
  } catch (err) {
    await logMessage(toPhoneE164, message.slice(0, 60), "FAILED", (err as Error).message, schoolId);
    throw err;
  }
}
