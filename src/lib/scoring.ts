// src/lib/scoring.ts
// Heuristic scam scorer that returns a score (0–100) *and* structured reasons.

import type { Job } from "./api";

/** Reason for the score that can be shown in the UI. */
export type Reason = {
  id: string;                              // stable key for UI
  label: string;                           // short chip
  explain: string;                         // sentence for bullets
  severity: "low" | "medium" | "high";     // for color/grouping
  points: number;                          // contribution to score
};

/** Nicely bucket scores for badge colors. */
export function bucket(score: number): "low" | "medium" | "high" {
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
}

// ---------- helpers ----------
const URL_RE = /(https?:\/\/[^\s)]+)|(www\.[^\s)]+)/i;

function norm(job: Job): string {
  const parts = [job.title ?? "", job.company ?? "", job.url ?? "", job.notes ?? ""];
  return parts.join(" ").toLowerCase();
}

function getDomain(u?: string | null): string | null {
  if (!u) return null;
  try {
    const url = u.startsWith("http") ? new URL(u) : new URL("http://" + u);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

const FREE_MAIL = /@(gmail|outlook|yahoo|hotmail|icloud)\.com\b/i;
const SHORTENERS = /(bit\.ly|t\.co|goo\.gl|tinyurl\.com|is\.gd|cutt\.ly|rb\.gy)\b/i;
const SUSPICIOUS_TLDS = /\.(top|xyz|rest|shop|click|work|cam|monster|best|buzz|lol|icu|link|live|club|online|win|men|date|wang)\b/i;

// ---------- rule set ----------
// Each rule returns true if the signal is present.
type Rule = Reason & { test: (t: string, job: Job) => boolean };

const RULES: Rule[] = [
  {
    id: "pay-unusual",
    label: "Unusual payment",
    explain: "Requests for gift cards, Zelle, or wire transfers are classic scam tells.",
    severity: "high",
    points: 35,
    test: (t) =>
      /(gift ?card|zelle|western union|moneygram|wire transfer|cashapp|venmo)\b/.test(t),
  },
  {
    id: "upfront-fee",
    label: "Upfront fee",
    explain: "Asking you to pay an application, processing, or equipment fee is a red flag.",
    severity: "high",
    points: 30,
    test: (t) => /(upfront|processing|application|equipment)\s+fee/.test(t) || /pay to apply/.test(t),
  },
  {
    id: "im-contact",
    label: "IM contact",
    explain: "Moving to Telegram or WhatsApp hides identities and evades platforms.",
    severity: "high",
    points: 25,
    test: (t) => /(telegram|whatsapp)\b/.test(t),
  },
  {
    id: "high-pay",
    label: "High pay mention",
    explain: "Excessive or flashy pay claims are commonly used as bait.",
    severity: "medium",
    points: 20,
    test: (t) => {
      if (/\$\s?\d{3,}/.test(t)) return true;                // any $xxx+ mention
      // day-rate style: $300–$700/day, 300-700/day, etc.
      return /\$?\d{3,}\s?(-|–|to)\s?\$?\d{3,}\s?\/?\s?(day|daily|week|weekly|hr|hour)/.test(t);
    },
  },
  {
    id: "link-shortener",
    label: "Link shortener",
    explain: "Link shorteners obscure final destinations and are common in scams.",
    severity: "medium",
    points: 15,
    test: (t) => SHORTENERS.test(t),
  },
  {
    id: "suspicious-domain",
    label: "Suspicious domain",
    explain: "Odd/throwaway TLDs (e.g., .top, .xyz) are common in scams.",
    severity: "medium",
    points: 18,
    test: (_t, job) => {
      const d = getDomain(job.url);
      return !!(d && SUSPICIOUS_TLDS.test(d));
    },
  },
  {
    id: "free-email",
    label: "Free email domain",
    explain: "Company claims a corporate entity but uses a personal email domain.",
    severity: "medium",
    points: 18,
    test: (t, job) =>
      FREE_MAIL.test(t) && /\b(inc|ltd|llc|corp|corporation|company|co\.)\b/i.test(job.company ?? ""),
  },
  {
    id: "urgent-noexp",
    label: "Too easy / urgent",
    explain: "“Urgent hire” or “no experience” paired with high pay is suspicious.",
    severity: "low",
    points: 10,
    test: (t) =>
      /(urgent hire|immediate start|start today|no experience|training provided|quick task)/.test(t),
  },
  {
    id: "remote-only",
    label: "Remote-only",
    explain: "Strictly remote contact with no company context can be used to lure victims.",
    severity: "low",
    points: 8,
    test: (t) => /(remote only|work from home|wfh)\b/.test(t),
  },
];

// ---------- scorer ----------
export function scoreJob(job: Job): { score: number; reasons: Reason[] } {
  const t = norm(job);

  // Base score nudged from declared risk (if present)
  let score = 0;
  if (job.risk === "medium") score += 10;
  if (job.risk === "high") score += 25;

  const hits: Reason[] = [];
  for (const r of RULES) {
    if (r.test(t, job)) {
      // push a copy without the test fn
      hits.push({ id: r.id, label: r.label, explain: r.explain, severity: r.severity, points: r.points });
      score += r.points;
    }
  }

  // Clamp and sort reasons by severity then points desc
  score = Math.max(0, Math.min(100, score));

  const order: Record<Reason["severity"], number> = { high: 0, medium: 1, low: 2 };
  const unique = dedupeById(hits).sort((a, b) => {
    const sev = order[a.severity] - order[b.severity];
    return sev !== 0 ? sev : b.points - a.points;
  });

  return { score, reasons: unique };
}

function dedupeById(list: Reason[]): Reason[] {
  const seen = new Set<string>();
  const out: Reason[] = [];
  for (const r of list) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}