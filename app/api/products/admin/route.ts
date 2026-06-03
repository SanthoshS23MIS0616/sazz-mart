import { NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/db";
import { requireRole } from "@/lib/security";

export async function GET() {
  const guard = await requireRole("admin");
  if (guard.error) return guard.error;
  return NextResponse.json({ products: await listProducts() });
}

export async function POST(request: Request) {
  const guard = await requireRole("admin");
  if (guard.error) return guard.error;
  const body = await request.json();
  const product = await createProduct({
    name: String(body.name || "").trim(),
    category: String(body.category || "General").trim(),
    description: String(body.description || "").trim(),
    price: Number(body.price || 0),
    stock: Number(body.stock || 0),
    rating: Number(body.rating || 4.5),
    image: String(body.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"),
    tags: String(body.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  });
  return NextResponse.json({ product }, { status: 201 });
}
