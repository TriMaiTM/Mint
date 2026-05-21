import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

// Load .env.local manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const firstEq = trimmed.indexOf("=");
      if (firstEq !== -1) {
        const key = trimmed.slice(0, firstEq).trim();
        const val = trimmed.slice(firstEq + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = val;
      }
    }
  });
}

const prisma = new PrismaClient();

async function main() {
  console.log("Checking database engine and enabling pg_trgm...");
  
  try {
    // 1. Enable extension pg_trgm
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log("✓ Extension pg_trgm enabled successfully.");
    
    // 2. Create GIN index for fuzzy search on Event.title and Event.venue
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS event_title_trgm_idx ON "Event" USING gin (title gin_trgm_ops);
    `);
    console.log("✓ GIN index on Event.title created.");

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS event_venue_trgm_idx ON "Event" USING gin (venue gin_trgm_ops);
    `);
    console.log("✓ GIN index on Event.venue created.");

    console.log("Database fuzzy search setup completed successfully.");
  } catch (error) {
    console.error("Error setting up pg_trgm on database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
