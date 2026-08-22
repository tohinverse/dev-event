import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { Event } from "@/database/event.model";

// Loose slug format guard: lowercase letters, numbers, and single hyphens
// between segments (matches the format produced by the Event model's
// slug-generation hook).
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json(
      { message: "Invalid or missing slug" },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const event = await Event.findOne({ slug });

    if (!event) {
      return NextResponse.json(
        { message: `Event with slug "${slug}" not found` },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Event fetched successfully", event },
      { status: 200 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Failed to fetch event",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
