import { NextRequest, NextResponse } from "next/server";
import { mockOrders } from "@/lib/mock-data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  await delay(300);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let orders = [...mockOrders];

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  return NextResponse.json({
    success: true,
    data: orders,
    total: orders.length,
  });
}

// POST /api/orders - Create an order
export async function POST(request: NextRequest) {
  await delay(400);

  try {
    const body = await request.json();

    if (!body.items || !body.customerName || !body.customerPhone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(
        Math.random() * 10000
      )}`,
      ...body,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: "Order created successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
