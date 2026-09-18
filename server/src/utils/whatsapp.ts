import CommunicationLog from "../models/CommunicationLog";

// WhatsApp Business Platform (Meta Cloud API). Confirmed current as of
// this writing: POST https://graph.facebook.com/<version>/<PHONE_NUMBER_ID>/messages,
// Bearer token auth - this is Meta's own stable, actively-maintained API
// (unlike the fragmented, inconsistently-documented local SMS gateway
// market - see MESSAGING-SETUP.md for why SMS below uses Twilio instead
// of guessing at a specific Pakistani reseller's API shape).
//
// IMPORTANT: outside a 24-hour window since the customer's last message
// to you, WhatsApp requires using a pre-approved message Template (set up
// and approved in Meta Business Manager) - you cannot send arbitrary free
// text for a "fee reminder" or "student absent" notification, since
// those are business-initiated with no prior customer message. This
// sends template messages by default for exactly that reason.

interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
}

export function getWhatsAppCredentials(): WhatsAppCredentials | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId, apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0" };
}

async function logMessage(to: string, subject: string, status: "SENT" | "FAILED", error?: string, schoolId?: string) {
  try {
    await CommunicationLog.create({ to, subject, status, error, schoolId, channel: "WHATSAPP" });
  } catch {
    // Best-effort, same reasoning as mailer.ts's logCommunication.
  }
}

// templateName must already exist and be APPROVED in Meta Business
// Manager for your WhatsApp Business Account - Meta rejects unknown or
// unapproved template names. bodyParams fill the template's {{1}},
// {{2}}... placeholders in order.
export async function sendWhatsAppTemplate(
  toPhoneE164: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[],
  schoolId?: string
): Promise<void> {
  const creds = getWhatsAppCredentials();
  if (!creds) {
    console.warn(`[whatsapp] Not configured - would have sent template "${templateName}" to ${toPhoneE164}`);
    await logMessage(toPhoneE164, `Template: ${templateName}`, "FAILED", "WhatsApp not configured", schoolId);
    return;
  }

  const url = `https://graph.facebook.com/${creds.apiVersion}/${creds.phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: toPhoneE164,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: bodyParams.length
        ? [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }]
        : undefined,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as any;
    if (!response.ok) {
      const message = data?.error?.message || `HTTP ${response.status}`;
      await logMessage(toPhoneE164, `Template: ${templateName}`, "FAILED", message, schoolId);
      throw new Error(message);
    }
    await logMessage(toPhoneE164, `Template: ${templateName}`, "SENT", undefined, schoolId);
  } catch (err) {
    await logMessage(toPhoneE164, `Template: ${templateName}`, "FAILED", (err as Error).message, schoolId);
    throw err;
  }
}
