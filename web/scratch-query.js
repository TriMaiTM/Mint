import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tiers = await prisma.ticketTier.findMany({
    include: {
      event: {
        select: {
          title: true,
          contractAddress: true,
        }
      }
    }
  });
  console.log("TICKET TIERS IN DB:");
  for (const t of tiers) {
    console.log(`Event: ${t.event.title} (${t.event.contractAddress}) | Tier Name: ${t.name} | Price: ${t.price} | MaxQty: ${t.maxQuantity} | Sold: ${t.soldCount}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
