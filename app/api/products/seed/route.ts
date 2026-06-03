import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db";

export async function POST() {
  return NextResponse.json(await seedDatabase());
}
