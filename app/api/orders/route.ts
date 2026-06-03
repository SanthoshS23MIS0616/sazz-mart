import { NextResponse } from "next/server";
import { createOrder, listOrders } from "@/lib/db";
import { requireRole } from "@/lib/security";

export async function GET() {
  const guard = await requireRole();
  if (guard.error) return guard.error;
  return NextResponse.json({ orders: await listOrders(guard.user.id) });
}

export async function POST(request: Request) {
  const guard = await requireRole();
  if (guard.error) return guard.error;
  const body = await request.json();
  const order = await createOrder({
    userId: guard.user.id,
    customerName: guard.user.name,
    customerEmail: guard.user.email,
    items: body.items || [],
    address: String(body.address || "").trim(),
    paymentMethod: String(body.paymentMethod || "Cash on delivery").trim()
  });
  return NextResponse.json({ order }, { status: 201 });
}
