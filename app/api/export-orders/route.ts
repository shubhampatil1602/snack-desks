import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const member = await auth.api.getActiveMember({
      headers: await headers(),
    });

    if (!member || (member.role !== "admin" && member.role !== "owner")) {
      return new Response("Forbidden", {
        status: 403,
      });
    }

    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return new Response("Missing date range", {
        status: 400,
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // include full end day
    toDate.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        organizationId: member.organizationId,
        status: "approved",
        orderWindow: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
      include: {
        user: true,
        orderWindow: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const rows = orders.map((order) => {
      const activeItems = order.items.filter((item) => !item.replacementApplied);
      const items = activeItems
        .map((item) => `${item.menuItem.name} × ${item.quantity}`)
        .join(" | ");

      const total = activeItems.reduce(
        (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
        0,
      );

      return [
        new Date(order.orderWindow.createdAt).toLocaleDateString("en-IN"),
        order.orderWindow.label,
        order.user.name,
        items,
        total.toFixed(2),
      ];
    });

    const csv = [["Date", "Window", "User", "Items", "Total"], ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${from}-${to}.csv"`,
      },
    });
  } catch (error) {
    console.error(error);

    return new Response("Failed to export orders", {
      status: 500,
    });
  }
}
