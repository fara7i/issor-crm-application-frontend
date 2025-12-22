import { NextRequest, NextResponse } from "next/server";
import { mockSalaries } from "@/lib/mock-data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /api/salaries - Get all salaries
export async function GET() {
  await delay(300);

  return NextResponse.json({
    success: true,
    data: mockSalaries,
    total: mockSalaries.length,
  });
}

// POST /api/salaries - Create a salary record
export async function POST(request: NextRequest) {
  await delay(400);

  try {
    const body = await request.json();

    if (!body.employeeName || !body.baseSalary) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newSalary = {
      id: `sal-${Date.now()}`,
      ...body,
      netSalary: body.baseSalary + (body.bonuses || 0) - (body.deductions || 0),
      status: "PENDING",
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newSalary,
      message: "Salary record created successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
