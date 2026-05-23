import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventTicketNftAbi } from "@/lib/contracts";
import { uploadMetadataToIPFS } from "@/lib/pinata";

function getChainRpc(): string {
  return process.env.SEPOLIA_RPC_URL ?? "https://sepolia.drpc.org";
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = verifySessionToken(
      cookieStore.get(getSessionCookieName())?.value,
    );
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      tierId?: string;
    };

    if (!body.tierId) {
      return NextResponse.json({ error: "Missing tierId" }, { status: 400 });
    }

    // Load tier + event
    const tier = await prisma.ticketTier.findUnique({
      where: { id: body.tierId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            contractAddress: true,
            startDate: true,
            venue: true,
            bannerImage: true,
          },
        },
      },
    });

    if (!tier) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    if (!tier.event.contractAddress) {
      return NextResponse.json(
        { error: "Event not published on-chain yet" },
        { status: 412 },
      );
    }

    const rpcUrl = getChainRpc();
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    // Read current nextTokenId from contract to predict the tokenId of the ticket being minted
    let currentNextTokenId = BigInt(0);
    try {
      currentNextTokenId = (await publicClient.readContract({
        address: tier.event.contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "nextTokenId",
      })) as bigint;
    } catch (err) {
      console.error("Failed to read nextTokenId from contract in prepare-metadata:", err);
    }
    const expectedTokenId = Number(currentNextTokenId) + 1;

    // Prepare metadata
    const metadataName = `${tier.event.title} - ${tier.name} #${expectedTokenId}`;
    const metadataDescription = `Vé NFT chính thức của sự kiện "${tier.event.title}". Hạng vé: ${tier.name}. Cung cấp quyền tham dự và xác thực on-chain.`;
    const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/events/${tier.event.id}`;
    
    const attributes = [
      { trait_type: "Sự kiện", value: tier.event.title },
      { trait_type: "Hạng vé", value: tier.name },
      { trait_type: "Địa điểm", value: tier.event.venue || "TBD" },
      { trait_type: "Thời gian bắt đầu", value: tier.event.startDate ? new Date(tier.event.startDate).toLocaleString("vi-VN") : "TBD" },
    ];


    const ipfsUri = await uploadMetadataToIPFS({
      name: metadataName,
      description: metadataDescription,
      image: tier.event.bannerImage || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
      external_url: eventUrl,
      attributes,
    });

    const tokenURI = ipfsUri ?? `ipfs://ticketnft/${tier.id}/${expectedTokenId}/${Date.now()}`;

    // Print clear terminal logs
    console.log(`[Prepare Metadata API] TokenURI generated for standard mint: ${tokenURI}`);

    return NextResponse.json({
      data: {
        tokenURI,
        expectedTokenId,
      },
    });
  } catch (error) {
    console.error("POST /api/tickets/prepare-metadata failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prepare metadata failed" },
      { status: 500 },
    );
  }
}
