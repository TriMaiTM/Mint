import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { TicketMarketplaceAbi } from "@/lib/contracts";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    const session = verifySessionToken(token);
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { ticketId },
      include: { ticket: { include: { event: true } } },
    });

    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Listing is not active or does not exist" },
        { status: 404 },
      );
    }

    if (listing.sellerId !== session.sub) {
      return NextResponse.json(
        { error: "You are not authorized to cancel this listing" },
        { status: 403 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark listing as CANCELLED
      await tx.listing.update({
        where: { ticketId },
        data: { status: "CANCELLED" },
      });

      // 2. Revert ticket status to MINTED
      return tx.ticket.update({
        where: { id: ticketId },
        data: { status: "MINTED" },
      });
    });

    // On-chain: call cancelListing(nft, tokenId) on the marketplace contract
    let onchainWarning: string | undefined;
    try {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("PRIVATE_KEY env variable not set");
      }

      const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
      if (!marketplaceAddress) {
        throw new Error("NEXT_PUBLIC_MARKETPLACE_ADDRESS env variable not set");
      }

      const contractAddress = listing.ticket.event.contractAddress;
      if (!contractAddress) {
        throw new Error("Event does not have a contract address");
      }

      const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://sepolia.drpc.org";
      const account = privateKeyToAccount(privateKey as `0x${string}`);

      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(rpcUrl),
      });

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(rpcUrl),
      });

      const data = encodeFunctionData({
        abi: TicketMarketplaceAbi,
        functionName: "cancelListing",
        args: [
          contractAddress as `0x${string}`,
          BigInt(listing.ticket.tokenId),
        ],
      });

      const txHash = await walletClient.sendTransaction({
        to: marketplaceAddress as `0x${string}`,
        data,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === "reverted") {
        onchainWarning =
          "On-chain cancelListing transaction reverted (listing may already be cancelled on-chain)";
        console.warn(onchainWarning, "tx:", txHash);
      }
    } catch (onchainError) {
      onchainWarning = `On-chain cancel failed: ${onchainError instanceof Error ? onchainError.message : String(onchainError)}`;
      console.error(onchainWarning);
    }

    return NextResponse.json({
      data: result,
      ...(onchainWarning ? { warning: onchainWarning } : {}),
    });
  } catch (error) {
    console.error("POST /api/marketplace/cancel failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
