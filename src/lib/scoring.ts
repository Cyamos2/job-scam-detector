// src/lib/scoring.ts
export type Severity = "low" | "medium" | "high";

export type Reason = {
  key: string;      // stable identifier
  label: string;    // short chip label
  severity: Severity;
  explain: string;  // one-line explanation
};

export type ScoreResult = {
  score: number;    // 0..100
  reasons: Reason[];
};

export type ScoreInput = {
  title?: string;
  company?: string;
  url?: string;       // use undefined (not null)
  notes?: string;     // use undefined (not null)
  risk?: Severity;    // user's declared risk bucket
};

/** Public: turn a DB row that may use nulls into ScoreInput */
export function toScoreInput(job: {
  title?: string | null;
  company?: string | null;
  url?: string | null;
  notes?: string | null;
  risk?: Severity | null;
}): ScoreInput {
  return {
    title: job.title ?? "",
    company: job.company ?? "",
    url: job.url ?? undefined,
    notes: job.notes ?? undefined,
    risk: (job.risk ?? undefined) as Severity | undefined,
  };
}

/** Public: map a numeric score to a bucket for badges/colors */
export function bucket(score: number): Severity {
  if (score >= 60) return "high";
  if (score >= 25) return "medium";
  return "low";
}

// --------- internal helpers ---------

const TLD_BAD = /\.(top|xyz|site|icu|click|cam|monster|gq|tk|ml|ga|cf)(?:\/|$)/i;
const HIGH_PAY_RE =
  /\b(\$|usd)?\s?(?:\d{2,3,})(?:\s?-\s?|\s?to\s?|\s?\/?\s?per\s?(?:day|week)|\s?\/?\s?day)\b/i;
const IM_RE = /\b(telegram|whatsapp|signal)\b/i;
const GIFT_RE = /\b(gift\s*card|zelle|wire\s*transfer)\b/i;
const URGENT_RE = /\b(urgent(ly)?|immediate(ly)?|start\s*now)\b/i;
const FREE_EMAIL_RE = /\b(@gmail\.com|@yahoo\.com|@outlook\.com|@hotmail\.com)\b/i;

function uniqBy<T extends { key: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const a of arr) {
    if (seen.has(a.key)) continue;
    seen.add(a.key);
    out.push(a);
  }
  return out;
}

// --------- MAIN: scoreJob ---------

export function scoreJob(job: ScoreInput): ScoreResult {
  const title = (job.title ?? "").toLowerCase();
  const notes = (job.notes ?? "").toLowerCase();
  const url = job.url ?? "";
  const text = `${title}\n${notes}`;

  const reasons: Reason[] = [];

  // Suspicious domain (MED)
  if (url && TLD_BAD.test(url)) {
    reasons.push({
      key: "suspicious-domain",
      label: "Suspicious domain",
      severity: "medium",
      explain: "Odd/throwaway TLDs (e.g., .top, .xyz) are common in scams.",
    });
  }

  // Free email domain (MED)
  if (FREE_EMAIL_RE.test(text)) {
    reasons.push({
      key: "free-email",
      label: "Free email domain",
      severity: "medium",
      explain:
        "Company claims a corporate entity but uses a personal/non-corp email.",
    });
  }

  // High pay bait (LOW)
  if (HIGH_PAY_RE.test(text)) {
    reasons.push({
      key: "high-pay",
      label: "High pay mention",
      severity: "low",
      explain: "Excessive/flashy pay claims are commonly used as bait.",
    });
  }

  // IM / off-platform move (MED)
  if (IM_RE.test(text)) {
    reasons.push({
      key: "im-contact",
      label: "IM contact",
      severity: "medium",
      explain:
        "Moving to Telegram/WhatsApp hides identities and evades platforms.",
    });
  }

  // Unusual payment method (HIGH)
  if (GIFT_RE.test(text)) {
    reasons.push({
      key: "unusual-payment",
      label: "Unusual payment",
      severity: "high",
      explain:
        "Requests for gift cards, Zelle, or wire transfers are classic tells.",
    });
  }

  // Urgency pressure (LOW)
  if (URGENT_RE.test(text)) {
    reasons.push({
      key: "urgency",
      label: "Urgent hire",
      severity: "low",
      explain: "Artificial urgency pressures quick decisions.",
    });
  }

  // Deduplicate by key
  const unique = uniqBy(reasons);

  // Weighting -> numeric score (cap 100)
  const weights: Record<Severity, number> = { high: 28, medium: 18, low: 8 };
  const base = unique.reduce((sum, r) => sum + weights[r.severity], 0);

  // User provided risk nudge
  const nudge =
    job.risk === "high" ? 30 : job.risk === "medium" ? 15 : 0;

  const score = Math.max(0, Math.min(100, base + nudge));

  return { score, reasons: unique };
}