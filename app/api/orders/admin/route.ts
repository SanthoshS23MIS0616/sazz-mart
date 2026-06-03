import { NextResponse } from "next/server";
import { listOrders } from "@/lib/db";
import { requireRole } from "@/lib/security";

export async function GET() {
  const guard = await requireRole("admin");
  if (guard.error) return guard.error;
  return NextResponse.json({ orders: await listOrders() });
}
