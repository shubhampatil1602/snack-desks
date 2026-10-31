import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = Number(amount);
  if (isNaN(num)) return "₹0.00";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Menu prices: whole rupees without ".00" (₹10), paise only when there are any (₹3.50)
export function formatPrice(amount: number | string): string {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  const fractionDigits = Number.isInteger(num) ? 0 : 2;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function truncateText(text: string, maxLength: number = 24): string {
  if (text.length > maxLength) {
    return `${text.slice(0, maxLength)}...`;
  }
  return text;
}

export function formatSplitNames(names: string[], maxVisible: number = 2): string {
  if (!names || names.length === 0) return "";
  if (names.length <= maxVisible) {
    return names.join(", ");
  }
  const visible = names[0];
  const remaining = names.length - 1;
  return `${visible} +${remaining} other${remaining > 1 ? "s" : ""}`;
}
