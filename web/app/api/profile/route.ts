import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);

    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            tickets: true,
            organizedEvents: true,
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("GET /api/profile failed", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);

    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, avatar } = body;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.sub },
      data: {
        ...(email !== undefined && { email: email || null }),
        ...(name !== undefined && { name: name || null }),
        ...(avatar !== undefined && { avatar: avatar || null }),
      },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error("PUT /api/profile failed", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
