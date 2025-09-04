// src/lib/scoring.ts
import type { Job } from "./api";

/** Heuristic keywords grouped by strength. */
const STRONG = [
  "wire transfer",
  "gift card",
  "crypto",
  "bitcoin",
  "cashapp",
  "zelle",
  "moneygram",
  "western union",
  "upfront fee",
  "processing fee",
  "equipment fee",
  "pay to apply",
  "telegram only",
  "whatsapp only",
  "verification code",
];

const MEDIUM = [
  "urgent hire",
  "immediate start",
  "no experience",
  "weekly payout",
  "training provided",
  "quick money",
  "commission only",
  "remote only",
  "work from home",
  "social media evaluator",
  "data entry (remote)",
];

const WEAK = [
  "flexible hours",
  "bonus",
  "earn",
  "sign-on bonus",
  "high pay",
  "part time",
];

/** Suspicious TLDs often used by scam landing pages. */
const SUSPICIOUS_TLDS = [
  ".top",
  ".xyz",
  ".site",
  ".click",
  ".link",
  ".rest",
  ".club",
  ".work",
  ".live",
  ".casa",
];

/** Normalize all text fields once. */
function textOf(job: Job): string {
  const parts = [
    job.title ?? "",
    job.company ?? "",
    job.url ?? "",
    job.notes ?? "",
  ];
  return parts.join(" ").toLowerCase();
}

/** Pull TLD from a URL string. */
function tldOf(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const idx = host.lastIndexOf(".");
    return idx >= 0 ? host.slice(idx) : null;
  } catch {
    return null;
  }
}

/** Score + reasons (0–100). */
export function scoreJob(job: Job): { score: number; reasons: string[] } {
  const t = textOf(job);
  const reasons: string[] = [];
  let score = 0;

  // 1) Base from declared risk (makes your manual label meaningful)
  const baseByRisk: Record<Job["risk"], number> = {
    low: 10,
    medium: 35,
    high: 60,
  };
  score += baseByRisk[job.risk ?? "low"];

  // 2) Keyword weights
  const addFrom = (arr: string[], pts: number) => {
    for (const kw of arr) {
      if (t.includes(kw)) {
        score += pts;
        reasons.push(kw);
      }
    }
  };
  addFrom(STRONG, 25);
  addFrom(MEDIUM, 12);
  addFrom(WEAK, 6);

  // 3) Heuristics
  // Big money talk
  if (/\b(\$|usd)\s?\d{3,}/.test(t)) {
    score += 10;
    reasons.push("big money mention");
  }
  // URL shorteners
  if (/https?:\/\/(bit\.ly|tinyurl\.|t\.co|goo\.gl|is\.gd|cutt\.ly)/.test(t)) {
    score += 12;
    reasons.push("link shortener");
  }
  // Free mail domain while pretending to be a company
  if (
    /@gmail\.com|@outlook\.com|@yahoo\.com|@icloud\.com/.test(t) &&
    /(inc|ltd|llc|corp|company)/.test(job.company ?? "")
  ) {
    score += 12;
    reasons.push("free email with company");
  }
  // Phone / chat handles often used in “text me on …” scams
  if (/\b(whatsapp|telegram|text me|dm me)\b/.test(t)) {
    score += 10;
    reasons.push("messaging-app contact");
  }
  // Suspicious TLD
  const tld = tldOf(job.url);
  if (tld && SUSPICIOUS_TLDS.includes(tld)) {
    score += 10;
    reasons.push(`suspicious tld ${tld}`);
  }
  // Lots of exclamations feels spammy
  const exclaims = (job.notes ?? "").split("!").length - 1;
  if (exclaims >= 3) {
    score += 6;
    reasons.push("excessive exclamation");
  }
  // Super short descriptions w/ big promises
  const notesLen = (job.notes ?? "").trim().length;
  if (notesLen > 0 && notesLen < 40 && /\b(high pay|earn|bonus)\b/.test(t)) {
    score += 8;
    reasons.push("short + promise");
  }

  // 4) Clamp & unique reasons
  score = Math.max(0, Math.min(100, score));
  const uniqueReasons = Array.from(new Set(reasons));

  return { score, reasons: uniqueReasons };
}

/** Buckets for UI colors */
export function bucket(score: number): "low" | "medium" | "high" {
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
}