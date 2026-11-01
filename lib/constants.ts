export const ORDER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Users who win the spin wheel only when nobody else ordered in the window
export const SPIN_EXCLUDED_USER_IDS: readonly string[] = [
  "hBnoaYLfQSivXVOcNY5Bj2JgbTWXR4po",
  "ZnQ2LO4x1qu0rGOocGebxXvq0OdTNhqu",
  "rfxrlBvbryRERoUnpgoy6dXx495yZbou",
];

// Banner line on the order window when the admin didn't write one
export const DEFAULT_WINDOW_TAGLINE =
  "Chal bhidu, nasta order karle chal... apna pet apna sagga hai, baki sab moh-maaya hai!";
