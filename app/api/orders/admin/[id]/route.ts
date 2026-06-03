import { NextResponse } from "next/server";
import type { OrderStatus } from "@/types/commerce";
import { updateOrderStatus } from "@/lib/db";
import { requireRole } from "@/lib/security";

const statuses: OrderStatus[] = ["placed", "packed", "shipped", "delivered", "cancelled"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("admin");
  if (guard.error) return guard.error;
  const params = await context.params;
  const body = await request.json();
  if (!statuses.includes(body.status)) {
    return NextResponse.json({ message: "Invalid order status" }, { status: 400 });
  }
  const order = await updateOrderStatus(params.id, body.status);
  if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}
