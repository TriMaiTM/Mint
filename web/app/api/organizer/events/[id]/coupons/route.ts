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

    const coupons = await prisma.coupon.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: coupons });
  } catch (error) {
    console.error("GET /api/organizer/events/[id]/coupons failed", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
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
    const { code, discountType, discountValue, maxUses, expiresAt } = body as {
      code?: string;
      discountType?: "PERCENTAGE" | "FIXED";
      discountValue?: number;
      maxUses?: number | null;
      expiresAt?: string | null;
    };

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(cleanCode)) {
      return NextResponse.json({ error: "Invalid coupon code format (3-20 characters, alphanumeric)" }, { status: 400 });
    }

    if (discountType !== "PERCENTAGE" && discountType !== "FIXED") {
      return NextResponse.json({ error: "Invalid discount type" }, { status: 400 });
    }

    if (discountValue <= 0) {
      return NextResponse.json({ error: "Discount value must be positive" }, { status: 400 });
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 });
    }

    // Check code duplication for this event
    const existing = await prisma.coupon.findUnique({
      where: {
        eventId_code: {
          eventId,
          code: cleanCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists for this event" }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        eventId,
        code: cleanCode,
        discountType,
        discountValue,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ data: coupon }, { status: 201 });
  } catch (error) {
    console.error("POST /api/organizer/events/[id]/coupons failed", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
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
    const couponId = searchParams.get("couponId");

    if (!couponId) {
      return NextResponse.json({ error: "Missing couponId parameter" }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id: couponId },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("DELETE /api/organizer/events/[id]/coupons failed", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
