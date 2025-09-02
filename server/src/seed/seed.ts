import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { prisma } from "../prisma";

// Local Risk type (matches prisma schema enum)
const RISK_VALUES = ["LOW", "MEDIUM", "HIGH"] as const;
type Risk = (typeof RISK_VALUES)[number];

function coerceRisk(input: unknown): Risk {
  const s = String(input ?? "").toUpperCase().trim();
  return (RISK_VALUES as readonly string[]).includes(s) ? (s as Risk) : "LOW";
}

async function clearAll() {
  await prisma.image.deleteMany({});
  await prisma.job.deleteMany({});
}

async function main() {
  const filePath = path.resolve(process.cwd(), "data/seed.csv");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed CSV not found at ${filePath}`);
  }

  const csv = fs.readFileSync(filePath, "utf-8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true });

  await clearAll();

  let count = 0;
  for (const row of rows) {
    const images = String(row.imageUris || "")
      .split(";")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const risk = coerceRisk(row.risk);
    const scoreNum = Number(row.score);
    const score = Number.isFinite(scoreNum) ? scoreNum : 0;

    await prisma.job.create({
      data: {
        title: row.title,
        company: row.company,
        url: row.url || null,
        email: row.email || null,
        source: row.source || null,
        risk,     // "LOW" | "MEDIUM" | "HIGH"
        score,    // 0–100
        notes: row.notes || null,
        images: { create: images.map((uri) => ({ uri })) },
      },
    });

    count++;
  }

  console.log(`✅ Seed complete: inserted ${count} jobs`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });