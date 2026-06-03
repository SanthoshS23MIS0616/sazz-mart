import { NextResponse } from "next/server";
import { readSession } from "@/lib/security";

export async function GET() {
  return NextResponse.json({ user: await readSession() });
}
