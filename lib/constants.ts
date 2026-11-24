export const ORDER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Banner line on the order window when the admin didn't write one
export const DEFAULT_WINDOW_TAGLINE =
  "Chal bhidu, nasta order karle chal... apna pet apna sagga hai, baki sab moh-maaya hai!";
