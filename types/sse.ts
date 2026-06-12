export type SnackDeskEvent =
  | {
      type: "window_opened";
      orgId: string;
      payload: {
        windowId: string;
        label: string;
        endsAt: string | null;
        startsAt: string;
      };
    }
  | { type: "window_closed"; orgId: string; payload: { windowId: string } }
  | {
      type: "order_placed";
      orgId: string;
      payload: { orderId: string; userId: string; userName: string };
    }
  | { type: "order_updated"; orgId: string; payload: { orderId: string } }
  | { type: "order_cancelled"; orgId: string; payload: { orderId: string } }
  | {
      type: "order_status_changed";
      orgId: string;
      payload: { orderId: string; status: string };
    };

export interface WindowOpenedPayload {
  windowId: string;
  label: string;
  endsAt: string | null;
  startsAt: string;
}

export interface WindowClosedPayload {
  windowId: string;
}

export interface OrderPlacedPayload {
  orderId: string;
  userId: string;
  userName: string;
}

export interface OrderUpdatedPayload {
  orderId: string;
}

export interface OrderCancelledPayload {
  orderId: string;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  status: string;
}
