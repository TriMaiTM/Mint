import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, code, tierId } = body as {
      eventId?: string;
      code?: string;
      tierId?: string;
    };

    if (!eventId || !code || !tierId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Fetch coupon, tier and event
    const coupon = await prisma.coupon.findUnique({
      where: {
        eventId_code: {
          eventId,
          code: cleanCode,
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon code not found for this event", isValid: false }, { status: 404 });
    }

    // Validation checks
    if (!coupon.isActive) {
      return NextResponse.json({ error: "Coupon is inactive", isValid: false }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Coupon has expired", isValid: false }, { status: 400 });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon usage limit reached", isValid: false }, { status: 400 });
    }

    const tier = await prisma.ticketTier.findUnique({
      where: { id: tierId },
    });

    if (!tier || tier.eventId !== eventId) {
      return NextResponse.json({ error: "Invalid ticket tier for this event", isValid: false }, { status: 400 });
    }

    // Calculations
    const originalPrice = Number(tier.price);
    let discountAmount = 0;

    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (originalPrice * Number(coupon.discountValue)) / 100;
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    // Cap discount amount at the price of the ticket
    if (discountAmount > originalPrice) {
      discountAmount = originalPrice;
    }

    const discountedPrice = Math.max(originalPrice - discountAmount, 0);

    return NextResponse.json({
      data: {
        couponId: coupon.id,
        isValid: true,
        originalPrice,
        discountAmount,
        discountedPrice,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
      },
    });
  } catch (error) {
    console.error("POST /api/tickets/validate-coupon failed", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
