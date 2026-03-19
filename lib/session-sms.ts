import { getUserInfo } from "@/data/usersinfo";
import { formatBrusselsDateTime } from "./date-time";

export type SessionSmsEventType = "created" | "updated" | "deleted" | "start_reminder" | "end_reminder";

interface SessionSmsPayload {
  eventType: SessionSmsEventType;
  userId: string;
  stationName: string;
  startTime: Date | string;
  endTime: Date | string | null;
}

type SmsDeliveryResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "not_configured" | "missing_phone_number" };

function formatSmsDateTime(value: Date | string): string {
  return formatBrusselsDateTime(value);
}

function buildSessionSmsMessage(payload: SessionSmsPayload): string {
  if (payload.eventType === "start_reminder") {
    const parts = [
      "Your charging session starts in 15 minutes.",
      `Station: ${payload.stationName}.`,
      `Start: ${formatSmsDateTime(payload.startTime)}.`,
    ];
    if (payload.endTime) {
      parts.push(`End: ${formatSmsDateTime(payload.endTime)}.`);
    }
    return parts.join(" ");
  }

  if (payload.eventType === "end_reminder") {
    const parts = [
      "Your charging session ends in 15 minutes.",
      `Station: ${payload.stationName}.`,
    ];
    if (payload.endTime) {
      parts.push(`End: ${formatSmsDateTime(payload.endTime)}.`);
    }
    return parts.join(" ");
  }

  const prefix =
    payload.eventType === "created"
      ? "Charging session booked"
      : payload.eventType === "updated"
        ? "Charging session updated"
        : "Charging session cancelled";
  const parts = [
    `${prefix}.`,
    `Station: ${payload.stationName}.`,
    `Start: ${formatSmsDateTime(payload.startTime)}.`,
  ];

  if (payload.endTime) {
    parts.push(`End: ${formatSmsDateTime(payload.endTime)}.`);
  }

  return parts.join(" ");
}

async function getPrimaryPhoneNumber(userId: string): Promise<string | null> {
  const user = await getUserInfo(userId);
  const mobileNumber = user?.mobileNumber?.trim();
  return mobileNumber ? mobileNumber : null;
}

async function sendTwilioSms(
  to: string,
  body: string,
  accountSid: string,
  authToken: string,
  from: string
): Promise<void> {
  const twilioApiBaseUrl = (process.env.TWILIO_API_BASE_URL ?? "https://api.twilio.com")
    .trim()
    .replace(/\/$/, "");
  const response = await fetch(
    `${twilioApiBaseUrl}/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: body,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio SMS request failed: ${response.status} ${errorText}`);
  }
}

export async function sendSessionEventSms(
  payload: SessionSmsPayload
): Promise<SmsDeliveryResult> {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID ?? "").trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN ?? "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER ?? "").trim();

  if (!accountSid || !authToken || !from) {
    return { status: "skipped", reason: "not_configured" };
  }

  const to = await getPrimaryPhoneNumber(payload.userId);
  if (!to) {
    return { status: "skipped", reason: "missing_phone_number" };
  }

  await sendTwilioSms(to, buildSessionSmsMessage(payload), accountSid, authToken, from);
  return { status: "sent" };
}
