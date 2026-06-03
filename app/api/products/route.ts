import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const products = await listProducts(query, category);
  return NextResponse.json({ products });
}
