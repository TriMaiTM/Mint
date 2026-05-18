import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { eventTicketNftAbi } from "@/lib/contracts";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = verifySessionToken(
      cookieStore.get(getSessionCookieName())?.value,
    );

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId, eventId, tokenId } = await req.json();

    if (!ticketId || !eventId || tokenId === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const me = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!me || (me.role !== "ORGANIZER" && me.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden: Not an organizer" },
        { status: 403 },
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.eventId !== eventId || ticket.tokenId !== tokenId) {
      return NextResponse.json(
        { error: "Invalid ticket data" },
        { status: 400 },
      );
    }

    if (ticket.event.organizerId !== me.id) {
      return NextResponse.json(
        { error: "You are not the organizer of this event" },
        { status: 403 },
      );
    }

    if (ticket.isUsed) {
      return NextResponse.json(
        { error: "Ticket has already been used" },
        { status: 400 },
      );
    }

    // Update in DB (off-chain check-in for speed)
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        status: "USED",
      },
    });

    // On-chain check-in: call useTicket(tokenId) on the event contract
    let onchainWarning: string | undefined;
    try {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("PRIVATE_KEY env variable not set");
      }

      const contractAddress = ticket.event.contractAddress;
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
        abi: eventTicketNftAbi,
        functionName: "useTicket",
        args: [BigInt(tokenId)],
      });

      const txHash = await walletClient.sendTransaction({
        to: contractAddress as `0x${string}`,
        data,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === "reverted") {
        onchainWarning =
          "On-chain useTicket transaction reverted (ticket may already be used on-chain)";
        console.warn(onchainWarning, "tx:", txHash);
      }
    } catch (onchainError) {
      onchainWarning = `On-chain check-in failed: ${onchainError instanceof Error ? onchainError.message : String(onchainError)}`;
      console.error(onchainWarning);
    }

    return NextResponse.json({
      success: true,
      ...(onchainWarning ? { warning: onchainWarning } : {}),
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
