// src/lib/scoring.ts
/**
 * Stricter, more explicit scoring.
 * - We cap at 100.
 * - We return a normalized score and detailed reasons with severities.
 * - Buckets are stricter (high >= 60, medium >= 30).
 */

export type Severity = "low" | "medium" | "high";

export type ScoreReason = {
  code: string;
  label: string;
  severity: Severity;
  weight: number; // contributes to score
};

export type ScoreInput = {
  title: string;
  company: string;
  url?: string;
  notes?: string;
  risk?: Severity; // optional legacy/manual tag – NOT used for bucket, only for context if needed
};

export type ScoreResult = {
  score: number; // 0..100
  reasons: ScoreReason[];
};

// ---------- helpers ----------
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const has = (s: string | undefined | null, rx: RegExp) =>
  !!(s && rx.test(s.toLowerCase()));

const textOf = (input: ScoreInput) =>
  [input.title, input.company, input.url, input.notes].filter(Boolean).join(" ").toLowerCase();

const hostFromUrl = (url?: string) => {
  try {
    if (!url) return undefined;
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return undefined;
  }
};

// very suspicious/public TLDs & fake-y second-levels
const SUSPICIOUS_TLD = /\.(top|xyz|click|cam|live|rest|loan|win|men|bid|work|zip|quest|cfd|cyou|mom|gq|ml|ga|tk|icu)$/i;

// looks like personal/free domain host
const FREE_HOST = /\.(weebly|wixsite|blogspot|wordpress|medium|notion|sites\.google|godaddysites)\.com$/i;

// messaging-only interview channels
const CHAT_ONLY = /(telegram|whats\s*app|whatsapp|signal|wechat|facebook\s*messenger)\b/;

// gift cards / crypto / wires upfront
const SUSPICIOUS_PAY = /(bitcoin|crypto|gift\s*card|western\s*union|moneygram|wire\s*transfer)\b/;

// immediate pay / upfront fee / equipment purchase
const UPFRONT = /(application\s*fee|training\s*fee|upfront|pay\s*to\s*apply|purchase\s*(equipment|materials))/;

// too remote-hype
const REMOTE_HYPE = /\b(remote[-\s]*only|work\s*from\s*home|wfh)\b/;

// grammar/typos heuristic: lots of !!! or ALL CAPS stretches
const SHOUTY = /!{2,}|([A-Z]{6,})/;

// title bait
const TITLE_BAIT = /(assistant|clerk|data\s*entry|package\s*handler|virtual\s*assistant)\b.*\b(no\s*experience|required)/;

// salary looks too good (simple heuristic)
const TOO_GOOD = /\$?\b([5-9]\d{2,})\b\s*(per\s*(week|day)|weekly|daily)/; // e.g., $900/day, $1500 weekly

// ---------- weights (stricter) ----------
const W = {
  // high severity
  SUSPICIOUS_TLD: 18,
  FREE_HOST: 16,
  CHAT_ONLY: 18,
  SUSPICIOUS_PAY: 24,   // very strong signal
  UPFRONT: 22,          // very strong signal
  TOO_GOOD: 16,

  // medium severity
  COMPANY_DOMAIN_MISMATCH: 14,
  TITLE_BAIT: 12,
  SHOUTY: 10,

  // low severity
  REMOTE_HYPE: 8,
} as const;

// ---------- scoring ----------
export function scoreJob(input: ScoreInput): ScoreResult {
  const reasons: ScoreReason[] = [];
  const all = textOf(input);
  const host = hostFromUrl(input.url);

  // 1) URL/TLD issues (HIGH/MED)
  if (host && SUSPICIOUS_TLD.test(host)) {
    reasons.push({
      code: "SUSPICIOUS_TLD",
      label: "Suspicious TLD",
      severity: "high",
      weight: W.SUSPICIOUS_TLD,
    });
  }
  if (host && FREE_HOST.test(host)) {
    reasons.push({
      code: "FREE_HOST",
      label: "Free/Personal hosting",
      severity: "high",
      weight: W.FREE_HOST,
    });
  }

  // 2) Company vs domain mismatch (MED)
  if (host && input.company) {
    const co = input.company.toLowerCase().replace(/[^a-z0-9]/g, "");
    const simplifiedHost = host.replace(/^www\./, "").replace(/\.(com|net|org|co|io|ai|biz|top|xyz|info|us)$/, "");
    if (co && !simplifiedHost.includes(co)) {
      reasons.push({
        code: "COMPANY_DOMAIN_MISMATCH",
        label: "Company/domain mismatch",
        severity: "medium",
        weight: W.COMPANY_DOMAIN_MISMATCH,
      });
    }
  }

  // 3) Payment/interview red flags (HIGH)
  if (has(all, SUSPICIOUS_PAY)) {
    reasons.push({
      code: "SUSPICIOUS_PAY",
      label: "Suspicious payment scheme",
      severity: "high",
      weight: W.SUSPICIOUS_PAY,
    });
  }
  if (has(all, CHAT_ONLY)) {
    reasons.push({
      code: "CHAT_ONLY",
      label: "Interview via chat app",
      severity: "high",
      weight: W.CHAT_ONLY,
    });
  }
  if (has(all, UPFRONT)) {
    reasons.push({
      code: "UPFRONT",
      label: "Upfront fee/purchase requested",
      severity: "high",
      weight: W.UPFRONT,
    });
  }

  // 4) “too good to be true” (HIGH/MED)
  if (has(all, TOO_GOOD)) {
    reasons.push({
      code: "TOO_GOOD",
      label: "Too-good-to-be-true pay",
      severity: "high",
      weight: W.TOO_GOOD,
    });
  }

  // 5) Copy quality / hype (MED/LOW)
  if (has(all, TITLE_BAIT)) {
    reasons.push({
      code: "TITLE_BAIT",
      label: "No-experience role bait",
      severity: "medium",
      weight: W.TITLE_BAIT,
    });
  }
  if (has(all, SHOUTY)) {
    reasons.push({
      code: "SHOUTY",
      label: "Poor grammar / shouting",
      severity: "medium",
      weight: W.SHOUTY,
    });
  }
  if (has(all, REMOTE_HYPE)) {
    reasons.push({
      code: "REMOTE_HYPE",
      label: "Remote-only hype",
      severity: "low",
      weight: W.REMOTE_HYPE,
    });
  }

  // Combo bonus: if *any* HIGH + any other signal, bump a little
  const hasHigh = reasons.some(r => r.severity === "high");
  if (hasHigh && reasons.length >= 2) {
    reasons.push({
      code: "COMBO_BONUS",
      label: "Multiple high/medium indicators",
      severity: "medium",
      weight: 6,
    });
  }

  // final score
  const raw = reasons.reduce((sum, r) => sum + r.weight, 0);
  const score = clamp(raw);

  // sort reasons: High → Medium → Low, then by weight desc
  reasons.sort((a, b) => {
    const sevRank = (s: Severity) => (s === "high" ? 3 : s === "medium" ? 2 : 1);
    const d = sevRank(b.severity) - sevRank(a.severity);
    return d !== 0 ? d : b.weight - a.weight;
  });

  return { score, reasons };
}

// stricter thresholds
export function bucket(score: number): Severity {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

// small helper for list preview
export function summarizeReasons(reasons: ScoreReason[], max = 2): string[] {
  return reasons.slice(0, max).map((r) => r.label);
}