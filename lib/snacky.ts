import { google } from "@ai-sdk/google";
import { formatInTimeZone } from "date-fns-tz";

// Snacky is SnackDesk's AI helper; every Snacky feature uses this model.
// Flash-Lite: the free tier allows 5 requests a minute on Flash, and one
// Ask Snacky answer takes two or three (a tool call, then the answer)
export const snackyModel = google("gemini-flash-lite-latest");

// the date and time in IST, so Snacky can work out "last month" or "today"
export function snackyNow() {
  return formatInTimeZone(new Date(), "Asia/Kolkata", "EEEE d MMMM yyyy, h:mm a 'IST'");
}

export const SNACKY_VOICE = `You are Snacky, the friendly helper inside SnackDesk, an office snack-ordering app in India.
Keep it short and warm, a little playful, never silly. Money is in Indian rupees, written like ₹1,250.`;

// what went wrong, in words an admin can act on; the AI SDK wraps Google's
// error (and its retries) so the status code can sit a level or two down
export function snackyErrorMessage(error: unknown) {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth++) {
    const status = (current as { statusCode?: number }).statusCode;
    if (status === 429) return "Snacky hit Google's free AI limit. Try again in a minute.";
    if (status === 500 || status === 503) return "Google's AI is busy right now. Try again in a bit.";
    const inner = current as { lastError?: unknown; cause?: unknown };
    current = inner.lastError ?? inner.cause;
  }
  return "Snacky couldn't answer that just now. Try again in a bit.";
}
