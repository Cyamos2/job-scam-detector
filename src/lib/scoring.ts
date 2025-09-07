// src/lib/scoring.ts
// Central scoring + helpers. Stricter, with failsafe high-risk rules.

export type Severity = "low" | "medium" | "high";

export type ScoreReason = {
  severity: Severity;
  label: string;
  code?: string;
};

export type ScoreInput = {
  title: string;
  company: string;
  url?: string;
  notes?: string;
  // User's own initial sense of risk (used only as a soft hint, not as a rule)
  risk: Severity;
};

export type ScoreResult = {
  score: number;           // 0..100
  reasons: ScoreReason[];  // sorted: high -> medium -> low
};

/* ------------------------------ tiny utils ------------------------------ */

const hasSuspiciousTLD = (u?: string) =>
  !!u?.match(/\.(top|xyz|click|cam|live|rest|loan|win|men|bid|work|vip)$/i);

const norm = (s?: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const hasRemoteOnlyHype = (t?: string, n?: string) => {
  const blob = `${t ?? ""} ${n ?? ""}`.toLowerCase();
  return /\b(remote[- ]?only|work from home|wfh)\b/.test(blob);
};

const hasPaymentScheme = (t?: string, n?: string) => {
  const blob = `${t ?? ""} ${n ?? ""}`.toLowerCase();
  return /\b(payroll|check ?cashing|money ?order|bitcoin|crypto|gift ?card)\b/.test(blob);
};

const hasUpfrontFee = (t?: string, n?: string) => {
  const blob = `${t ?? ""} ${n ?? ""}`.toLowerCase();
  return /\b(upfront fee|purchase equipment|training fee|application fee|pay(?:ment)? required)\b/.test(blob);
};

const manyExclaims = (t?: string, n?: string) =>
  (t ?? "").split("!").length + (n ?? "").split("!").length > 5;

/* ------------------------------ reasons -------------------------------- */

function collectReasons(input: ScoreInput): ScoreReason[] {
  const { title, company, url, notes } = input;
  const reasons: ScoreReason[] = [];

  // HIGH — suspicious payment / crypto / gift cards, etc.
  if (hasPaymentScheme(title, notes)) {
    reasons.push({ severity: "high", label: "Suspicious payment scheme", code: "PAY" });
  }

  // MED — suspicious TLDs (common throwaway domains)
  if (hasSuspiciousTLD(url)) {
    reasons.push({ severity: "medium", label: "Suspicious TLD", code: "TLD" });
  }

  // MED — company vs domain mismatch (best-effort heuristic)
  if (url) {
    const m = url.match(/^https?:\/\/([^/]+)/i);
    const host = m?.[1] ?? "";
    const hostCo = norm(host.split(".").slice(-2, -1)[0]); // approximate brand
    const co = norm(company);
    if (hostCo && co && !hostCo.includes(co) && !co.includes(hostCo)) {
      reasons.push({ severity: "medium", label: "Company/domain mismatch", code: "MISMATCH" });
    }
  }

  // LOW — remote-only hype
  if (hasRemoteOnlyHype(title, notes)) {
    reasons.push({ severity: "low", label: "Remote-only hype", code: "REMOTE" });
  }

  // LOW — excessive exclamation marks
  if (manyExclaims(title, notes)) {
    reasons.push({ severity: "low", label: "Excessive exclamation marks", code: "EXCL" });
  }

  return reasons;
}

function sortReasons(reasons: ScoreReason[]): ScoreReason[] {
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return reasons.slice().sort((a, b) => order[a.severity] - order[b.severity]);
}

/* ------------------------------- bucket -------------------------------- */

export function bucket(score: number, hasMedium: boolean, hasHigh: boolean): Severity {
  // stricter cutoff per your spec
  const HIGH_CUTOFF = 55;
  if (score >= HIGH_CUTOFF || hasHigh) return "high";
  if (hasMedium) return "medium";
  return "low";
}

/** Convenience wrapper so callers can pass just a ScoreResult or just a number. */
export function visualBucket(arg: ScoreResult | number, hasMedium?: boolean, hasHigh?: boolean): Severity {
  if (typeof arg === "number") {
    return bucket(arg, !!hasMedium, !!hasHigh);
  }
  const med = arg.reasons.some(r => r.severity === "medium");
  const hi  = arg.reasons.some(r => r.severity === "high");
  return bucket(arg.score, med, hi);
}

/* -------------------------------- score -------------------------------- */

export function scoreJob(input: ScoreInput): ScoreResult {
  const reasons = collectReasons(input);

  // Failsafe (automatic high) — critical red-flag combos
  const hasHigh   = reasons.some(r => r.severity === "high");
  const hasMedium = reasons.some(r => r.severity === "medium");
  const critical  = hasHigh && hasUpfrontFee(input.title, input.notes);

  if (critical) {
    // Make the reason explicit
    reasons.push({ severity: "high", label: "Upfront fee + payment red flag", code: "FAILSAFE" });
  }

  // Weighted sum (cumulative severity balance)
  const highCount = reasons.filter(r => r.severity === "high").length;
  const medCount  = reasons.filter(r => r.severity === "medium").length;
  const lowCount  = reasons.filter(r => r.severity === "low").length;

  let score = 0;

  if (critical) score = 85; // force high baseline for failsafe
  score += highCount * 22 + medCount * 11 + lowCount * 5;

  // Small bonus for diversity of flags (max +6)
  const kindCount = (highCount ? 1 : 0) + (medCount ? 1 : 0) + (lowCount ? 1 : 0);
  score += Math.min(6, kindCount * 2);

  // Clamp & round
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, reasons: sortReasons(reasons) };
}