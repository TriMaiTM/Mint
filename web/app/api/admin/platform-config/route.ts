import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONFIG_ID = "global";

async function getOrCreateConfig() {
  try {
    let config = await prisma.platformConfig.findUnique({
      where: { id: CONFIG_ID },
    });
    if (!config) {
      config = await prisma.platformConfig.create({
        data: {
          id: CONFIG_ID,
          maintenanceMode: false,
          allowEventCreation: true,
          allowUserRegistration: true,
          allowSecondaryMarketplace: true,
          blockedWallets: [],
          alertBannerText: "",
          maxTickets: 5,
        },
      });
    }
    return config;
  } catch (e) {
    console.error("Error reading platform config from DB, falling back to default:", e);
    return {
      id: CONFIG_ID,
      maintenanceMode: false,
      allowEventCreation: true,
      allowUserRegistration: true,
      allowSecondaryMarketplace: true,
      blockedWallets: [] as string[],
      alertBannerText: "",
      maxTickets: 5,
    };
  }
}

export async function GET(request: NextRequest) {
  const config = await getOrCreateConfig();
  return NextResponse.json({ success: true, config });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const currentConfig = await getOrCreateConfig();

    const updatedConfig = await prisma.platformConfig.upsert({
      where: { id: CONFIG_ID },
      update: {
        maintenanceMode: body.maintenanceMode !== undefined ? Boolean(body.maintenanceMode) : currentConfig.maintenanceMode,
        allowEventCreation: body.allowEventCreation !== undefined ? Boolean(body.allowEventCreation) : currentConfig.allowEventCreation,
        allowUserRegistration: body.allowUserRegistration !== undefined ? Boolean(body.allowUserRegistration) : currentConfig.allowUserRegistration,
        allowSecondaryMarketplace: body.allowSecondaryMarketplace !== undefined ? Boolean(body.allowSecondaryMarketplace) : currentConfig.allowSecondaryMarketplace,
        blockedWallets: Array.isArray(body.blockedWallets) ? body.blockedWallets : currentConfig.blockedWallets,
        alertBannerText: body.alertBannerText !== undefined ? String(body.alertBannerText) : (currentConfig.alertBannerText || ""),
        maxTickets: body.maxTickets !== undefined ? Number(body.maxTickets) : (currentConfig.maxTickets || 5),
      },
      create: {
        id: CONFIG_ID,
        maintenanceMode: body.maintenanceMode !== undefined ? Boolean(body.maintenanceMode) : false,
        allowEventCreation: body.allowEventCreation !== undefined ? Boolean(body.allowEventCreation) : true,
        allowUserRegistration: body.allowUserRegistration !== undefined ? Boolean(body.allowUserRegistration) : true,
        allowSecondaryMarketplace: body.allowSecondaryMarketplace !== undefined ? Boolean(body.allowSecondaryMarketplace) : true,
        blockedWallets: Array.isArray(body.blockedWallets) ? body.blockedWallets : [],
        alertBannerText: body.alertBannerText !== undefined ? String(body.alertBannerText) : "",
        maxTickets: body.maxTickets !== undefined ? Number(body.maxTickets) : 5,
      },
    });

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error("POST /api/admin/platform-config failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
