import { NextRequest, NextResponse } from "next/server";
import { mockProducts } from "@/lib/mock-data";

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  await delay(300);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  let products = [...mockProducts];

  if (search) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (category) {
    products = products.filter((p) => p.category === category);
  }

  return NextResponse.json({
    success: true,
    data: products,
    total: products.length,
  });
}

// POST /api/products - Create a product
export async function POST(request: NextRequest) {
  await delay(400);

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category || body.sellingPrice === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In a real app, save to database
    const newProduct = {
      id: `prod-${Date.now()}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: "Product created successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
