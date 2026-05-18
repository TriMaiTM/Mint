import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify session
    const cookieStore = await cookies();
    const session = verifySessionToken(
      cookieStore.get(getSessionCookieName())?.value,
    );
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify organizer role
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, role: true },
    });
    if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Organizer access required" },
        { status: 403 },
      );
    }

    // Verify event belongs to organizer
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, organizerId: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizerId !== user.id) {
      return NextResponse.json(
        { error: "You do not own this event" },
        { status: 403 },
      );
    }

    // Parse body
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      venue?: string;
      bannerImage?: string;
      startDate?: string;
      endDate?: string;
      maxAttendees?: number | null;
    };

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 },
      );
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    // Update event
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        venue: body.venue?.trim() ?? null,
        bannerImage: body.bannerImage?.trim() ?? null,
        startDate,
        endDate,
        maxAttendees: body.maxAttendees ?? null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("POST /api/events/[id]/edit failed", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}
