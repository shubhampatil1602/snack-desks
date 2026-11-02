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
