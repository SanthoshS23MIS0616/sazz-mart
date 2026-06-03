import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/lib/db";
import { requireRole } from "@/lib/security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("admin");
  if (guard.error) return guard.error;
  const params = await context.params;
  const body = await request.json();
  const product = await updateProduct(params.id, {
    name: body.name,
    category: body.category,
    description: body.description,
    price: body.price === undefined ? undefined : Number(body.price),
    stock: body.stock === undefined ? undefined : Number(body.stock),
    rating: body.rating === undefined ? undefined : Number(body.rating),
    image: body.image,
    tags: Array.isArray(body.tags) ? body.tags : undefined
  });
  if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireRole("admin");
  if (guard.error) return guard.error;
  const params = await context.params;
  const deleted = await deleteProduct(params.id);
  if (!deleted) return NextResponse.json({ message: "Product not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
