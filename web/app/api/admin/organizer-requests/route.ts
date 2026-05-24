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

    const admin = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const requests = await prisma.organizerRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("GET /api/admin/organizer-requests failed", error);
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

    const admin = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json(
        { error: "requestId and action ('APPROVE' or 'REJECT') are required" },
        { status: 400 }
      );
    }

    const reqItem = await prisma.organizerRequest.findUnique({
      where: { id: requestId },
    });

    if (!reqItem) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (reqItem.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    let updatedRequest;
    if (action === "APPROVE") {
      const [updatedReq] = await prisma.$transaction([
        prisma.organizerRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        }),
        prisma.user.update({
          where: { id: reqItem.userId },
          data: { role: "ORGANIZER" },
        }),
      ]);
      updatedRequest = updatedReq;
    } else {
      updatedRequest = await prisma.organizerRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error("POST /api/admin/organizer-requests failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
