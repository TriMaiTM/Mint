import { NextRequest, NextResponse } from "next/server";
import { recoverMessageAddress } from "viem";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAgeSeconds,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      walletAddress?: string;
      signature?: string;
      nonceId?: string;
    };

    const walletAddress = body.walletAddress?.toLowerCase();
    if (!walletAddress || !body.signature) {
      return NextResponse.json(
        { error: "walletAddress and signature are required" },
        { status: 400 }
      );
    }

    const challenge = body.nonceId
      ? await prisma.authNonce.findFirst({
          where: {
            id: body.nonceId,
            walletAddress,
            usedAt: null,
          },
        })
      : await prisma.authNonce.findFirst({
          where: {
            walletAddress,
            usedAt: null,
          },
          orderBy: { createdAt: "desc" },
        });

    if (!challenge || challenge.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Sign-in challenge expired or not found" },
        { status: 401 }
      );
    }

    const recoveredAddress = await recoverMessageAddress({
      message: challenge.message,
      signature: body.signature as `0x${string}`,
    });

    if (recoveredAddress.toLowerCase() !== walletAddress) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Read platform configurations to enforce policies from DB
    let allowUserRegistration = true;
    let blockedWallets: string[] = [];
    try {
      const config = await prisma.platformConfig.findUnique({
        where: { id: "global" },
      });
      if (config) {
        allowUserRegistration = config.allowUserRegistration !== false;
        blockedWallets = Array.isArray(config.blockedWallets) ? config.blockedWallets : [];
      }
    } catch (e) {
      console.error("Error reading platform config in verify API:", e);
    }

    // 1. Enforce blocked wallets blocklist
    const isBlocked = blockedWallets.map((w) => w.toLowerCase()).includes(walletAddress);
    if (isBlocked) {
      return NextResponse.json(
        { error: "Your wallet address is restricted from accessing this platform." },
        { status: 403 }
      );
    }

    // 2. Enforce new registrations allowed setting
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!existingUser && !allowUserRegistration) {
      return NextResponse.json(
        { error: "New user registrations are currently disabled by the Administrator." },
        { status: 403 }
      );
    }

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: {
        walletAddress,
        role: "USER",
      },
    });

    await prisma.authNonce.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    });

    const token = createSessionToken(user.id, user.walletAddress);
    const response = NextResponse.json({
      data: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionMaxAgeSeconds(),
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/verify failed", error);

    if (error instanceof Error && error.message.includes("Missing AUTH_SECRET")) {
      return NextResponse.json(
        { error: "Server auth configuration is missing (AUTH_SECRET)." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to verify wallet signature" },
      { status: 500 }
    );
  }
}
