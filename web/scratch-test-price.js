import { PrismaClient } from "@prisma/client";
import { parseEther } from "viem";

const prisma = new PrismaClient();

async function main() {
  const tier = await prisma.ticketTier.findFirst({
    where: {
      name: "Exclusive",
      event: {
        title: "Test Event"
      }
    }
  });
  if (tier) {
    console.log("Tier price type:", typeof tier.price, tier.price);
    console.log("Tier price string:", tier.price.toString());
    console.log("parseEther(tier.price.toString()):", parseEther(tier.price.toString()).toString());
    console.log("Hex representation:", "0x" + parseEther(tier.price.toString()).toString(16));
  } else {
    console.log("Tier not found");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
