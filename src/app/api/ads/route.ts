import { NextRequest, NextResponse } from "next/server";
import { mockAdCampaigns } from "@/lib/mock-data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /api/ads - Get all ad campaigns
export async function GET() {
  await delay(300);

  return NextResponse.json({
    success: true,
    data: mockAdCampaigns,
    total: mockAdCampaigns.length,
  });
}

// POST /api/ads - Create an ad campaign
export async function POST(request: NextRequest) {
  await delay(400);

  try {
    const body = await request.json();

    if (!body.name || !body.platform || body.cost === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newCampaign = {
      id: `ad-${Date.now()}`,
      ...body,
      costPerResult: body.results > 0 ? body.cost / body.results : 0,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newCampaign,
      message: "Campaign created successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
