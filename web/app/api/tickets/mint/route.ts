import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
  decodeEventLog,
  parseEther,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventTicketNftAbi } from "@/lib/contracts";
import { sendEmail, generateTicketPurchaseEmail } from "@/lib/email";
import { uploadMetadataToIPFS } from "@/lib/pinata";

/**
 * POST /api/tickets/mint
 *
 * Server-side mint: organizer mints ticket to user's wallet.
 * Bypasses MetaMask RPC issues.
 */

function getChainRpc(): string {
  return process.env.SEPOLIA_RPC_URL ?? "https://sepolia.drpc.org";
}

function getPrivateKey(): `0x${string}` {
  const key = process.env.PRIVATE_KEY;
  if (!key) throw new Error("Missing PRIVATE_KEY");
  return key.startsWith("0x")
    ? (key as `0x${string}`)
    : (`0x${key}` as `0x${string}`);
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
      couponCode?: string;
      txHash?: string;
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
            organizerId: true,
            startDate: true,
            venue: true,
            bannerImage: true,
            organizer: {
              select: {
                walletAddress: true,
              },
            },
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

    if (tier.soldCount >= tier.maxQuantity) {
      return NextResponse.json({ error: "Tier sold out" }, { status: 409 });
    }


    if (tier.onchainTierId === null) {
      return NextResponse.json(
        { error: "Tier not linked to on-chain tier" },
        { status: 400 },
      );
    }

    // Get user wallet address
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, walletAddress: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Coupon logic
    let discountAmount = 0;
    let finalPrice = Number(tier.price);
    let couponId: string | null = null;

    if (body.couponCode) {
      const cleanCode = body.couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: {
          eventId_code: {
            eventId: tier.eventId,
            code: cleanCode,
          },
        },
      });

      if (!coupon) {
        return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      }
      if (!coupon.isActive) {
        return NextResponse.json({ error: "Coupon is inactive" }, { status: 400 });
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
      }
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
      }

      couponId = coupon.id;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (finalPrice * Number(coupon.discountValue)) / 100;
      } else {
        discountAmount = Number(coupon.discountValue);
      }
      if (discountAmount > finalPrice) {
        discountAmount = finalPrice;
      }
      finalPrice = Math.max(finalPrice - discountAmount, 0);
    }

    const rpcUrl = getChainRpc();
    const account = privateKeyToAccount(getPrivateKey());

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl),
    });

    // Verify transaction if payment is required (finalPrice > 0 and coupon was used)
    const isDiscounted = body.couponCode && finalPrice > 0;
    if (isDiscounted) {
      if (!body.txHash) {
        return NextResponse.json({ error: "Missing txHash for discounted payment" }, { status: 400 });
      }

      // Check if txHash has already been used to prevent replay attacks
      const existingOrder = await prisma.order.findFirst({
        where: { txHash: body.txHash },
      });
      const existingTicket = await prisma.ticket.findFirst({
        where: { txHash: body.txHash },
      });
      if (existingOrder || existingTicket) {
        return NextResponse.json({ error: "Giao dịch đã được sử dụng trước đó (Replay attack)" }, { status: 409 });
      }

      try {
        const tx = await publicClient.getTransaction({ hash: body.txHash as `0x${string}` });
        const txReceipt = await publicClient.getTransactionReceipt({ hash: body.txHash as `0x${string}` });

        if (txReceipt.status !== "success") {
          return NextResponse.json({ error: "Giao dịch blockchain thất bại hoặc chưa thành công" }, { status: 400 });
        }

        const expectedOrganizerAddress = tier.event.organizer.walletAddress;
        if (!tx.to || tx.to.toLowerCase() !== expectedOrganizerAddress.toLowerCase()) {
          return NextResponse.json({ error: "Người nhận trong giao dịch không khớp với ví ban tổ chức" }, { status: 400 });
        }

        const expectedValue = parseEther(finalPrice.toFixed(6));
        if (tx.value < expectedValue) {
          return NextResponse.json({
            error: `Số tiền thanh toán không khớp. Yêu cầu: ${finalPrice.toFixed(6)} POL, Thực tế nhận: ${Number(tx.value) / 1e18} POL`
          }, { status: 400 });
        }
      } catch (err) {
        console.error("Blockchain transaction validation failed:", err);
        return NextResponse.json({ error: "Không thể xác minh giao dịch blockchain" }, { status: 400 });
      }
    }

    // Read current nextTokenId from contract to predict the tokenId of the ticket being minted
    let currentNextTokenId = BigInt(0);
    try {
      currentNextTokenId = (await publicClient.readContract({
        address: tier.event.contractAddress as `0x${string}`,
        abi: eventTicketNftAbi,
        functionName: "nextTokenId",
      })) as bigint;
    } catch (err) {
      console.error("Failed to read nextTokenId from contract before mint:", err);
    }
    const expectedTokenId = Number(currentNextTokenId) + 1;

    // Call organizerMint to mint NFT to user's address
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

    const mintData = encodeFunctionData({
      abi: eventTicketNftAbi,
      functionName: "organizerMint",
      args: [user.walletAddress as `0x${string}`, tier.onchainTierId, tokenURI],
    });

    const mintTxHash = await walletClient.sendTransaction({
      to: tier.event.contractAddress as `0x${string}`,
      data: mintData,
      gas: BigInt(500_000),
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: mintTxHash,
    });

    // Parse TicketMinted event to get tokenId
    let tokenId: number | undefined;
    const mintedTopic =
      "0x395ab5891d7a7cb8666fd5b76a45b09f1801c75d979e44914e4a45b76578183e";

    for (const log of receipt.logs) {
      if (log.topics[0] === mintedTopic) {
        try {
          const decoded = decodeEventLog({
            abi: eventTicketNftAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.args && "tokenId" in decoded.args) {
            tokenId = Number(decoded.args.tokenId);
            break;
          }
        } catch {}
      }
    }

    if (!tokenId) {
      // Fallback: read nextTokenId from contract and subtract 1
      try {
        const nextId = await publicClient.readContract({
          address: tier.event.contractAddress as `0x${string}`,
          abi: eventTicketNftAbi,
          functionName: "nextTokenId",
        });
        tokenId = Number(nextId) - 1;
      } catch {
        tokenId = Date.now() % 100000; // Last resort fallback
      }
    }

    // Record in DB
    const result = await prisma.$transaction(async (tx) => {
      await tx.ticketTier.update({
        where: { id: tier.id },
        data: { soldCount: { increment: 1 } },
      });

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const order = await tx.order.create({
        data: {
          userId: session.sub,
          eventId: tier.eventId,
          couponId,
          totalAmount: finalPrice,
          paymentMethod: "CRYPTO",
          status: "CONFIRMED",
          txHash: body.txHash ?? mintTxHash,
        },
      });

      const ticket = await tx.ticket.create({
        data: {
          eventId: tier.eventId,
          tierId: tier.id,
          ownerId: session.sub,
          tokenId,
          txHash: mintTxHash,
          status: "MINTED",
          isUsed: false,
          qrCode: `${tier.eventId}:${tokenId}`,

        },
      });

      return { order, ticket };
    });

    // Send email notification (non-blocking)
    if (user.email) {
      const eventDate = tier.event.startDate
        ? new Date(tier.event.startDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "TBD";

      sendEmail({
        to: user.email,
        subject: `🎫 Ticket Confirmed - ${tier.event.title}`,
        html: generateTicketPurchaseEmail({
          eventTitle: tier.event.title,
          tierName: tier.name,
          tokenId: result.ticket.tokenId,
          eventDate,
          venue: tier.event.venue || "TBD",
          txHash: body.txHash ?? mintTxHash,
        }),
      }).catch((err) => console.error("Failed to send purchase email:", err));
    }

    console.log(`[Mint API] Ticket minted successfully! Token ID: ${tokenId}, TxHash: ${mintTxHash}, TokenURI: ${tokenURI}`);

    return NextResponse.json({
      data: {
        orderId: result.order.id,
        ticketId: result.ticket.id,
        tokenId: result.ticket.tokenId,
        txHash: body.txHash ?? mintTxHash,
        tokenURI,
      },
    });
  } catch (error) {
    console.error("POST /api/tickets/mint failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mint failed" },
      { status: 500 },
    );
  }
}
