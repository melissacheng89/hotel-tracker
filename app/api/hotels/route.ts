import { NextResponse } from "next/server";
import { getHotels } from "@/lib/notion";

export async function GET() {
  try {
    const hotels = await getHotels();
    return NextResponse.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotels" },
      { status: 500 }
    );
  }
}