import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
  verifyMessage,
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

    const { ticketId, eventId, tokenId, timestamp, signature } = await req.json();

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
        owner: true,
        tier: true,
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

    // --- Dynamic QR Code Signature Verification ---
    if (!timestamp || !signature) {
      return NextResponse.json(
        { error: "Yêu cầu chữ ký xác thực ví và mốc thời gian để check-in bảo mật." },
        { status: 400 },
      );
    }

    // Check expiration (60 seconds)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(nowSeconds - Number(timestamp));
    if (timeDiff > 60) {
      return NextResponse.json(
        { error: "Mã QR đã hết hạn. Vui lòng yêu cầu khách hàng làm mới mã QR." },
        { status: 400 },
      );
    }

    // Verify signature
    const expectedMessage = `Verify ownership of Ticket #${tokenId} at timestamp: ${timestamp}`;
    const isSignatureValid = await verifyMessage({
      address: ticket.owner.walletAddress as `0x${string}`,
      message: expectedMessage,
      signature: signature as `0x${string}`,
    });

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Chữ ký số không hợp lệ. Khách hàng quét mã QR không phải là chủ sở hữu vé." },
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
      let privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("PRIVATE_KEY env variable not set");
      }
      if (!privateKey.startsWith("0x")) {
        privateKey = `0x${privateKey}`;
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
      ticket: {
        id: ticket.id,
        tokenId: ticket.tokenId,
        isUsed: true,
        usedAt: new Date(),
        owner: {
          name: ticket.owner.name,
          email: ticket.owner.email,
          walletAddress: ticket.owner.walletAddress,
        },
        tier: {
          name: ticket.tier.name,
          price: ticket.tier.price,
        },
        event: {
          title: ticket.event.title,
        },
      },
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
