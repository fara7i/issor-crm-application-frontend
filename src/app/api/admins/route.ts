import { NextRequest, NextResponse } from "next/server";
import { mockAdminUsers } from "@/lib/mock-data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /api/admins - Get all admins
export async function GET() {
  await delay(300);

  return NextResponse.json({
    success: true,
    data: mockAdminUsers,
    total: mockAdminUsers.length,
  });
}

// POST /api/admins - Create an admin
export async function POST(request: NextRequest) {
  await delay(400);

  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newAdmin = {
      id: `admin-${Date.now()}`,
      name: body.name,
      email: body.email,
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newAdmin,
      message: "Admin created successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
