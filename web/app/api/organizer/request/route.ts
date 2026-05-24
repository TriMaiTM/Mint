import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);

    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRequest = await prisma.organizerRequest.findFirst({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, request: userRequest || null });
  } catch (error) {
    console.error("GET /api/organizer/request failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);

    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "ORGANIZER" || user.role === "ADMIN") {
      return NextResponse.json(
        { error: "You already have organizer or administrator privileges" },
        { status: 400 }
      );
    }

    const { orgName, email, website, description } = await request.json();

    if (!orgName || !email || !description) {
      return NextResponse.json(
        { error: "Organization name, email, and description are required" },
        { status: 400 }
      );
    }
    
    const existingPending = await prisma.organizerRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending organizer request" },
        { status: 400 }
      );
    }

    await prisma.organizerRequest.deleteMany({
      where: {
        userId: user.id,
        status: { not: "PENDING" },
      },
    });

    const newRequest = await prisma.organizerRequest.create({
      data: {
        userId: user.id,
        userWalletAddress: user.walletAddress,
        userName: user.name || "Unnamed",
        orgName,
        email,
        website: website || "",
        description,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error("POST /api/organizer/request failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
