// src/lib/scoring.ts
export type Risk = "low" | "medium" | "high";

export type ScoreReason = {
  severity: Risk;
  label: string;
  code: string; // internal tag for combos/failsafes
};

export type ScoreResult = {
  score: number;        // 0–100
  reasons: ScoreReason[];
  hasHigh: boolean;
  hasMedium: boolean;
  hasLow: boolean;
};

// ---------------------------
// Keyword helpers
// ---------------------------
const rx = {
  // money flow / crypto
  suspiciousPay: /\b(crypto|bitcoin|btc|usdt|cash\s*app|zelle|gift\s*card|western\s*union|money\s*gram|wire\s*transfer|money\s*order)\b/i,
  upfrontFee: /\b(upfront\s*fee|fee\s+to\s+apply|pay\s+(a )?deposit|training\s*(kit|fee)|equipment\s*fee)\b/i,

  // classic reshipper / mule / check-cashing
  mule: /\b(reship(p|ping)?|package\s*(inspector|handler)|parcel\s*forward|logistics\s*agent|shipping\s*agent|invoice\s*processing|check\s*cashing|escrow\s*agent)\b/i,

  // contact off-platform
  msgApp: /\b(whats\s*app|whatsapp|telegram|signal|wechat)\b/i,

  // exclamations overload
  manyExclaims: /!{3,}/,

  // phone embedded (very common in scams)
  phone: /(\+?\d[\s\-().]{0,3}){7,}/,

  // unrealistic pay
  unrealisticPay: /\b(daily\s*pay|paid\s*daily|earn\s+\$\d{3,}\s*(per|\/)\s*day|guaranteed\s*income)\b/i,

  // remote hype
  remoteOnly: /\b(remote[-\s]*only|work\s*from\s*home|wfh)\b/i,

  // suspicious TLDs
  badTld: /\.(top|xyz|live|cash|rest|loan|win|men|bid|work|zip|icu)(?:\/|$)/i,
};

// ---------------------------
// URL/Domain utilities
// ---------------------------
function hostFromUrl(u?: string | null) {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.host.toLowerCase();
  } catch {
    return null;
  }
}

function companyDomain(company: string) {
  // naive “company.com” derivation for mismatch hint
  const c = company.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!c) return null;
  return `${c}.com`;
}

// ---------------------------
// Scoring
// ---------------------------
export function scoreJob(input: {
  title: string;
  company: string;
  url?: string;
  notes?: string;
  risk: Risk; // user-provided prior
}): ScoreResult {
  const { title, company, url, notes } = input;
  const text = `${title}\n${company}\n${notes ?? ""}`;

  const reasons: ScoreReason[] = [];

  // ——— Mediums (foundational) ———
  // Suspicious TLD
  if (url && rx.badTld.test(url)) {
    reasons.push({ severity: "medium", label: "Suspicious TLD", code: "tld" });
  }

  // Company vs domain mismatch (only if both are available)
  const host = hostFromUrl(url);
  const inferred = companyDomain(company || "");
  if (host && inferred && !host.includes(inferred)) {
    reasons.push({
      severity: "medium",
      label: "Company/domain mismatch",
      code: "mismatch",
    });
  }

  // Phone number in body
  if (rx.phone.test(text)) {
    reasons.push({
      severity: "medium",
      label: "Phone number embedded in description",
      code: "phone",
    });
  }

  // Unrealistic daily pay
  if (rx.unrealisticPay.test(text)) {
    reasons.push({
      severity: "medium",
      label: "Unrealistic daily pay",
      code: "unrealistic",
    });
  }

  // ——— High severity (major red flags) ———
  if (rx.suspiciousPay.test(text)) {
    reasons.push({
      severity: "high",
      label: "Suspicious payment scheme",
      code: "suspiciousPay",
    });
  }

  if (rx.upfrontFee.test(text)) {
    reasons.push({
      severity: "high",
      label: "Upfront fee/purchase requested",
      code: "upfrontFee",
    });
  }

  if (rx.mule.test(text)) {
    reasons.push({
      severity: "high",
      label: "Reshipper/money mule pattern",
      code: "mule",
    });
  }

  if (rx.msgApp.test(text)) {
    reasons.push({
      severity: "high",
      label: "Asks to contact via messaging app",
      code: "msgApp",
    });
  }

  // ——— Low severity (weak signals) ———
  if (rx.remoteOnly.test(text)) {
    reasons.push({
      severity: "low",
      label: "Remote-only hype",
      code: "remote",
    });
  }

  if (rx.manyExclaims.test(text)) {
    reasons.push({
      severity: "low",
      label: "Excessive exclamation marks",
      code: "exclaim",
    });
  }

  // ---------------------------
  // Weighted sum + diversity boost
  // ---------------------------
  const highCount = reasons.filter(r => r.severity === "high").length;
  const medCount  = reasons.filter(r => r.severity === "medium").length;
  const lowCount  = reasons.filter(r => r.severity === "low").length;

  // weights (tunable)
  let score = highCount * 24 + medCount * 12 + lowCount * 5;

  // diversity: different severities present → small extra nudge
  const kindCount = (highCount ? 1 : 0) + (medCount ? 1 : 0) + (lowCount ? 1 : 0);
  score += Math.min(8, kindCount * 3);

  // failsafe rule: combo of suspicious payment & upfront fee ⇒ force high
  const codes = new Set(reasons.map(r => r.code));
  if (codes.has("suspiciousPay") && codes.has("upfrontFee")) {
    score = Math.max(score, 85);
  }

  // clamp 0..100 and round
  score = Math.max(0, Math.min(100, Math.round(score)));

  // stable sort reasons (High → Medium → Low, keep insertion order inside groups)
  const sorted = sortReasons(reasons);

  return {
    score,
    reasons: sorted,
    hasHigh: highCount > 0,
    hasMedium: medCount > 0,
    hasLow: lowCount > 0,
  };
}

function sortReasons(list: ScoreReason[]) {
  const order: Record<Risk, number> = { high: 0, medium: 1, low: 2 };
  return [...list].sort((a, b) => order[a.severity] - order[b.severity]);
}

// ---------------------------
// Visual bucket (used by list & badges)
// ---------------------------
export function visualBucket(result: ScoreResult): Risk {
  // strict clamp: any MEDIUM reason means at least Medium
  if (result.hasHigh) return "high";
  if (result.score >= 60) return "high";   // raise high cutoff a bit
  if (result.hasMedium) return "medium";
  if (result.score >= 30) return "medium"; // stricter medium floor
  return "low";
}