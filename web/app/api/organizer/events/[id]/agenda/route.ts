import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: eventId } = await params;
    const cookieStore = await cookies();
    const session = verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== session.sub) {
      const me = await prisma.user.findUnique({
        where: { id: session.sub },
      });
      if (me?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const agenda = await prisma.agendaItem.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: agenda });
  } catch (error) {
    console.error("GET /api/organizer/events/[id]/agenda failed", error);
    return NextResponse.json({ error: "Failed to fetch agenda" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: eventId } = await params;
    const cookieStore = await cookies();
    const session = verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== session.sub) {
      const me = await prisma.user.findUnique({
        where: { id: session.sub },
      });
      if (me?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { time, title, description, speaker } = body as {
      time?: string;
      title?: string;
      description?: string;
      speaker?: string;
    };

    if (!time || !title) {
      return NextResponse.json({ error: "Missing time or title" }, { status: 400 });
    }

    const agendaItem = await prisma.agendaItem.create({
      data: {
        eventId,
        time: time.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        speaker: speaker?.trim() || null,
      },
    });

    return NextResponse.json({ data: agendaItem }, { status: 201 });
  } catch (error) {
    console.error("POST /api/organizer/events/[id]/agenda failed", error);
    return NextResponse.json({ error: "Failed to create agenda item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: eventId } = await params;
    const cookieStore = await cookies();
    const session = verifySessionToken(cookieStore.get(getSessionCookieName())?.value);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== session.sub) {
      const me = await prisma.user.findUnique({
        where: { id: session.sub },
      });
      if (me?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const agendaId = searchParams.get("agendaId");

    if (!agendaId) {
      return NextResponse.json({ error: "Missing agendaId parameter" }, { status: 400 });
    }

    await prisma.agendaItem.delete({
      where: { id: agendaId },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/organizer/events/[id]/agenda failed", error);
    return NextResponse.json({ error: "Failed to delete agenda item" }, { status: 500 });
  }
}
