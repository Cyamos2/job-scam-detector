// src/lib/scoring.ts
// Heuristic scam scorer with human-friendly “reason” explanations.

import type { Job } from "../lib/api";

/** Weighted term buckets (tune freely). */
const STRONG_TERMS: Array<[key: string, needle: RegExp, points: number]> = [
  ["gift cards", /\bgift\s*card(s)?\b/i, 25],
  ["upfront fee", /\b(upfront|processing|application|equipment|training)\s+fee(s)?\b/i, 25],
  ["crypto payment", /\b(crypto|bitcoin|btc)\b/i, 25],
  ["IM contact", /\b(telegram|whatsapp)\b/i, 20],
  ["verification code", /\bverification\s*code\b/i, 18],
];

const MEDIUM_TERMS: Array<[key: string, needle: RegExp, points: number]> = [
  ["urgent hire", /\burgent\s+hire\b/i, 14],
  ["immediate start", /\b(immediate|start\s+immediately)\b/i, 12],
  ["no experience", /\bno\s+experience\b/i, 12],
  ["high pay", /\b(high\s+pay|earn\s+\$\d{3,}|\$\d{3,}\s+per\s+(day|hour|week))\b/i, 12],
  ["weekly payout", /\b(weekly\s+payout|daily\s+payout|paid\s+daily)\b/i, 10],
  ["quick task", /\b(quick\s+task|90\s*minutes|easy\s+work)\b/i, 10],
  ["commission only", /\bcommission\s+only\b/i, 10],
  ["work from home", /\bwork\s+from\s+home\b/i, 8],
  ["remote only", /\b(remote\s+only)\b/i, 8],
];

const WEAK_TERMS: Array<[key: string, needle: RegExp, points: number]> = [
  ["flexible hours", /\bflexible\s+hours?\b/i, 5],
  ["bonus", /\bbonus(es)?\b/i, 4],
  ["sign-on bonus", /\bsign[- ]on\s+bonus\b/i, 5],
  ["limited slots", /\b(limited\s+slots|only\s+\d+\s+positions?)\b/i, 4],
];

/** Help text for each reason. */
const REASON_HELP: Record<string, string> = {
  "gift cards": "Scammers often request gift cards as payment—unrecoverable and untraceable.",
  "upfront fee": "Legit employers don’t ask you to pay to apply, train, or get equipment.",
  "crypto payment": "Requests to pay via crypto are a classic scam red flag.",
  "IM contact": "Moving to Telegram/WhatsApp hides identities and evades platforms.",
  "verification code": "Verification-code requests are commonly used for account takeovers.",
  "urgent hire": "Pressure to act quickly limits your time to verify legitimacy.",
  "immediate start": "Rushing start dates is another pressure tactic.",
  "no experience": "Promises of high pay with no experience are classic bait.",
  "high pay": "Unusually high or fast pay for easy work is suspicious.",
  "weekly payout": "Fast payouts are a lure used by many scams.",
  "quick task": "Very short tasks with big payouts are common in scams.",
  "commission only": "Can be legit, but used in many bait-and-switch scams.",
  "work from home": "Fine alone—paired with other red flags increases risk.",
  "remote only": "Absolute remote-only across every step can be suspicious.",
  "flexible hours": "Harmless alone; consider only with other flags.",
  "bonus": "Over-promised perks are a lure.",
  "sign-on bonus": "Unusually large sign-on bonuses can be fake.",
  "limited slots": "Artificial scarcity to push quick decisions.",
  "money talk": "Heavy emphasis on money is a common lure.",
  "link shortener": "Short links hide real destinations (often phishing).",
  "suspicious domain": "Odd/throwaway TLDs (e.g., .top, .xyz) are common in scams.",
  "free email domain": "Corporate jobs should use company email, not free email.",
  "excess punctuation": "Overuse of !!!/??? appears frequently in scam pitches.",
};

/** Utility: join all job text once (lowercased). */
function textOf(job: Job): string {
  return [
    job.title ?? "",
    job.company ?? "",
    job.url ?? "",
    job.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

/** Map reason key -> nicer label. */
export function reasonLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** One-liner explanation for a reason key. */
export function reasonHelp(key: string): string {
  return REASON_HELP[key] ?? "Potential risk indicator based on text analysis.";
}

/** Score and reasons (0–100). */
export function scoreJob(job: Job): { score: number; reasons: string[] } {
  const t = textOf(job);
  let score = 0;
  const reasons: Set<string> = new Set();

  const apply = (rules: Array<[string, RegExp, number]>) => {
    for (const [label, needle, pts] of rules) {
      if (needle.test(t)) {
        score += pts;
        reasons.add(label);
      }
    }
  };

  apply(STRONG_TERMS);
  apply(MEDIUM_TERMS);
  apply(WEAK_TERMS);

  // Heuristics
  if (/\b(\$|usd)\s?\d{3,}/i.test(t)) {
    score += 8;
    reasons.add("money talk");
  }
  if (/https?:\/\/(bit\.ly|tinyurl|t\.co|goo\.gl|linktr\.ee)/i.test(t)) {
    score += 8;
    reasons.add("link shortener");
  }
  if (/\.(top|xyz|click|monster|win|info|bid|loan)(\/|$)/i.test(job.url ?? "")) {
    score += 12;
    reasons.add("suspicious domain");
  }
  if (/@(gmail|outlook|yahoo)\.com/i.test(t) && /(inc|ltd|llc)\b/i.test(job.company ?? "")) {
    score += 10;
    reasons.add("free email domain");
  }
  if (/[!?]{3,}/.test(t)) {
    score += 5;
    reasons.add("excess punctuation");
  }

  // Clamp to 0..100
  score = Math.max(0, Math.min(100, score));
  return { score, reasons: Array.from(reasons) };
}

/** Simple buckets for UI tinting. */
export function bucket(score: number): "low" | "medium" | "high" {
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
}