// src/lib/scoring.ts

// -------------------- Types --------------------
export type Risk = "low" | "medium" | "high";

export type ScoreReason = {
  severity: Risk; // severity bucket
  label: string;  // human-friendly message
};

export type ScoreResult = {
  score: number;
  reasons: ScoreReason[];
};

export type ScoreInput = {
  title: string;
  company: string;
  url?: string;
  notes?: string;
  risk: Risk;
};

// -------------------- Scoring Logic --------------------
export function scoreJob(input: ScoreInput): ScoreResult {
  let score = 0;
  const reasons: ScoreReason[] = [];

  const { title, company, url, notes } = input;

  // Suspicious TLDs
  if (url) {
    const badTlds = /\.(top|xyz|click|cam|live|rest|loan|win|men|bid|work)(\/|$)/i;
    if (badTlds.test(url)) {
      score += 18;
      reasons.push({ severity: "high", label: "Suspicious TLD" });
    }

    // Company vs domain mismatch
    const hostMatch = url.match(/^https?:\/\/([^/]+)/);
    if (hostMatch) {
      const host = hostMatch[1].toLowerCase();
      const normCo = company.replace(/[^a-z]/gi, "").toLowerCase();
      if (normCo && !host.includes(normCo)) {
        score += 6;
        reasons.push({ severity: "medium", label: "Company/domain mismatch" });
      }
    }
  }

  // Remote-only hype
  if (/work\s*from\s*home|remote/i.test(title)) {
    score += 12;
    reasons.push({ severity: "low", label: "Remote-only hype" });
  }

  // Notes analysis
  if (notes) {
    if (/wire money|checks|bitcoin/i.test(notes)) {
      score += 25;
      reasons.push({ severity: "high", label: "Suspicious payment scheme" });
    }
    if (/grammar|typos/i.test(notes)) {
      score += 8;
      reasons.push({ severity: "low", label: "Poor grammar/typos" });
    }
  }

  // Final clamp
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return { score, reasons };
}

// -------------------- Bucketing Helper --------------------
export function bucket(score: number): Risk {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}