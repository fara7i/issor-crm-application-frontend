import { NextRequest, NextResponse } from "next/server";
import { mockCharges } from "@/lib/mock-data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /api/charges - Get all charges
export async function GET(request: NextRequest) {
  await delay(300);

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  let charges = [...mockCharges];

  if (category) {
    charges = charges.filter((c) => c.category === category);
  }

  return NextResponse.json({
    success: true,
    data: charges,
    total: charges.length,
  });
}

// POST /api/charges - Create a charge
export async function POST(request: NextRequest) {
  await delay(400);

  try {
    const body = await request.json();

    if (!body.category || !body.amount || !body.description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newCharge = {
      id: `chg-${Date.now()}`,
      ...body,
      createdAt: new Date(),
      createdBy: "Current User",
    };

    return NextResponse.json({
      success: true,
      data: newCharge,
      message: "Charge created successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
