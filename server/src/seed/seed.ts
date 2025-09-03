import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { prisma } from "../prisma";

type Risk = "low" | "medium" | "high";

type Row = {
  title: string;
  company: string;
  url?: string;
  notes?: string;
  risk?: string; // may be LOW/MEDIUM/HIGH — we’ll coerce
  // legacy/ignored columns are safe to keep:
  email?: string;
  source?: string;
  score?: string | number;
  imageUris?: string;
};

function coerceRisk(input?: string): Risk {
  const v = (input ?? "").trim().toLowerCase();
  if (v === "high" || v === "medium" || v === "low") return v;
  if (/^high$/i.test(input ?? "")) return "high";
  if (/^medium$/i.test(input ?? "")) return "medium";
  if (/^low$/i.test(input ?? "")) return "low";
  return "low";
}

async function main() {
  const csvPath = path.resolve(process.cwd(), "data/seed.csv");
  if (!fs.existsSync(csvPath)) {
    console.log("No data/seed.csv found; skipping seed.");
    return;
  }

  const content = fs.readFileSync(csvPath, "utf8");

  // Some versions of csv-parse/sync type the result as unknown.
  // Force a concrete type so `row` isn’t unknown in the loop.
  const rows = (parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as unknown) as Row[];

  let count = 0;

  for (const row of rows) {
    const title = (row.title ?? "").trim();
    const company = (row.company ?? "").trim();
    if (!title || !company) {
      console.log("Skipping row without title/company:", row);
      continue;
    }

    await prisma.job.create({
      data: {
        title,
        company,
        url: row.url?.trim() || null,
        notes: row.notes?.trim() || null,
        risk: coerceRisk(row.risk),
      },
    });

    count++;
  }

  console.log(`✅ Seeded ${count} job(s) from data/seed.csv`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());