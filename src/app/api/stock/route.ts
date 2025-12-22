import { NextRequest, NextResponse } from "next/server";
import { mockStock } from "@/lib/mock-data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /api/stock - Get all stock
export async function GET() {
  await delay(300);

  return NextResponse.json({
    success: true,
    data: mockStock,
    total: mockStock.length,
  });
}

// PUT /api/stock - Update stock quantity
export async function PUT(request: NextRequest) {
  await delay(400);

  try {
    const body = await request.json();

    if (!body.productId || body.quantity === undefined || !body.changeType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In a real app, update in database
    return NextResponse.json({
      success: true,
      message: "Stock updated successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
