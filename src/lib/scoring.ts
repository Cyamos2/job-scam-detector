// src/lib/scoring.ts
import type { Job } from "../lib/api";

/** Keywords grouped by strength. Tune freely. */
const STRONG = [
  "wire transfer", "gift card", "crypto", "bitcoin",
  "cashapp", "zelle", "upfront fee", "processing fee",
  "send money", "pay to apply", "equipment fee",
  "telegram only", "whatsapp only",
];

const MEDIUM = [
  "work from home", "remote only", "urgent hire", "immediate start",
  "no experience", "high pay", "weekly payout", "training provided",
  "part time 1–2h", "quick task", "social media evaluator",
];

const WEAK = [
  "flexible hours", "bonus", "earn", "commission", "sign-on bonus",
];

/** Normalize text once. */
function textOf(job: Job): string {
  const parts = [job.title ?? "", job.company ?? "", job.url ?? "", job.notes ?? ""];
  return parts.join(" ").toLowerCase();
}

/** Returns score 0–100 and reasons found. */
export function scoreJob(job: Job): { score: number; reasons: string[] } {
  const t = textOf(job);
  let score = 0;
  const reasons: string[] = [];

  const add = (arr: string[], pts: number) => {
    for (const kw of arr) {
      if (t.includes(kw)) {
        score += pts;
        reasons.push(kw);
      }
    }
  };

  add(STRONG, 20);
  add(MEDIUM, 10);
  add(WEAK, 5);

  // Heuristics
  if (/\b(\$|usd)\s?\d{3,}/.test(t)) score += 8; // lots of money talk
  if (/https?:\/\/(bit\.|tinyurl|t\.co|goo\.gl)/.test(t)) score += 8; // link shorteners
  if (/@gmail\.com|@outlook\.com|@yahoo\.com/.test(t) && /(inc|ltd|llc)/i.test(job.company ?? "")) {
    score += 10; // “company” but free email
    reasons.push("free email domain");
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));
  return { score, reasons: Array.from(new Set(reasons)) };
}

/** Buckets for UI badge/colors */
export function bucket(score: number): "low" | "medium" | "high" {
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
}

/* ---------------- Back-compat helpers (optional) ---------------- */

/** Old API: return only the list of matched keywords. */
export function explainScore(job: Job): string[] {
  return scoreJob(job).reasons;
}

/** Old API: map a 0..100 score to a green→yellow→red color. */
export function colorForScore(score: number): string {
  const t = Math.max(0, Math.min(100, score)) / 100; // 0..1
  const mid = 0.5;
  let r: number, g: number, b: number;

  if (t <= mid) {
    // green(46,204,113) -> yellow(255,200,0)
    const u = t / mid;
    r = Math.round(46 + (255 - 46) * u);
    g = Math.round(204 + (200 - 204) * u);
    b = Math.round(113 + (0 - 113) * u);
  } else {
    // yellow(255,200,0) -> red(239,68,68)
    const u = (t - mid) / (1 - mid);
    r = Math.round(255 + (239 - 255) * u);
    g = Math.round(200 + (68 - 200) * u);
    b = Math.round(0 + (68 - 0) * u);
  }
  return `rgb(${r},${g},${b})`;
}