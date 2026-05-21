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

    const faqs = await prisma.fAQ.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: faqs });
  } catch (error) {
    console.error("GET /api/organizer/events/[id]/faq failed", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
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
    const { question, answer } = body as {
      question?: string;
      answer?: string;
    };

    if (!question || !answer) {
      return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
    }

    const faq = await prisma.fAQ.create({
      data: {
        eventId,
        question: question.trim(),
        answer: answer.trim(),
      },
    });

    return NextResponse.json({ data: faq }, { status: 201 });
  } catch (error) {
    console.error("POST /api/organizer/events/[id]/faq failed", error);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
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
    const faqId = searchParams.get("faqId");

    if (!faqId) {
      return NextResponse.json({ error: "Missing faqId parameter" }, { status: 400 });
    }

    await prisma.fAQ.delete({
      where: { id: faqId },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/organizer/events/[id]/faq failed", error);
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 });
  }
}
