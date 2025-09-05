// --- types used across the app ---
export type Severity = "low" | "medium" | "high";

export type Reason = {
  key: string;        // stable identifier
  label: string;      // short chip label
  severity: Severity; // how bad it is
  explain: string;    // one-line explanation
};

export type ScoreInput = {
  title: string;
  company: string;
  url?: string;
  notes?: string;
  risk?: Severity; // user hint (optional)
};

export type ScoreResult = {
  score: number;   // 0..100
  reasons: Reason[];
};

// ---- bucket helpers used by ScoreBadge & lists ----
export function bucket(score: number): Severity {
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}
export function bucketLabel(s: Severity): string {
  return s.toUpperCase();
}

// ---- your real scoring implementation (kept intact) ----
// NOTE: Accepts ScoreInput not DB Job, so screens can safely call it anytime.
export function scoreJob(job: ScoreInput): ScoreResult {
  const text = [
    job.title ?? "",
    job.company ?? "",
    job.url ?? "",
    job.notes ?? "",
  ].join(" ").toLowerCase();

  const reasons: Reason[] = [];

  // examples; keep your full rules here
  if (/\b(?:gift\s*card|zelle|wire transfer)\b/.test(text)) {
    reasons.push({
      key: "unusual-payment",
      label: "Unusual payment",
      severity: "high",
      explain: "Requests for gift cards, Zelle, or wire transfers are classic scam tells.",
    });
  }
  if (/\b(?:telegram|whatsapp)\b/.test(text)) {
    reasons.push({
      key: "im-contact",
      label: "IM contact",
      severity: "high",
      explain: "Moving to Telegram/WhatsApp hides identities and evades platforms.",
    });
  }
  if (/\b(?:\$?\d{3,}\/?(?:day|week)|\$\d{2,},\d{3})\b/.test(text)) {
    reasons.push({
      key: "high-pay",
      label: "High pay mention",
      severity: "medium",
      explain: "Excessive or flashy pay claims are commonly used as bait.",
    });
  }
  if (job.url && /\.(top|xyz|icu|live|site|rest)(\/|$)/i.test(job.url)) {
    reasons.push({
      key: "suspicious-domain",
      label: "Suspicious domain",
      severity: "medium",
      explain: "Odd/throwaway TLDs (e.g., .top, .xyz) are common in scams.",
    });
  }
  if (/\b(gmail|yahoo|outlook|hotmail)\.com\b/.test(text) && !/@[^.\s]+\.(com|org|net|edu)\b/.test(text)) {
    reasons.push({
      key: "free-email",
      label: "Free email domain",
      severity: "medium",
      explain: "Uses a free email domain instead of a corporate domain.",
    });
  }

  // weight & score
  const weights: Record<Severity, number> = { high: 28, medium: 18, low: 8 };
  const uniq = new Map<string, Reason>();
  for (const r of reasons) if (!uniq.has(r.key)) uniq.set(r.key, r);
  const unique = [...uniq.values()];
  const raw = unique.reduce((sum, r) => sum + weights[r.severity], 0);

  // nudge with user risk if provided
  let score = Math.min(100, raw);
  if (job.risk === "high") score = Math.min(100, score + 10);
  else if (job.risk === "medium") score = Math.min(100, score + 5);

  return { score, reasons: unique };
}