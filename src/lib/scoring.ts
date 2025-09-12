// src/lib/scoring.ts
// Stricter, conservative scoring with clear reasons + buckets.

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
};

export type ScoreResult = {
  score: number;     // 0..100
  reasons: Reason[]; // matched reasons
};

/* ---------------- helpers ---------------- */

const rx = (s: string, flags = "i") => new RegExp(s, flags);
const has = (text: string, re: RegExp) => re.test(text);

function norm(s?: string) {
  return (s ?? "").toLowerCase().trim();
}

// Combine all fields to scan for patterns
function blob(input: ScoreInput): string {
  return [input.title, input.company, input.url, input.notes]
    .map((x) => norm(x))
    .join("\n");
}

function hostOf(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function looksHttps(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

const SUSPICIOUS_TLDS = new Set([
  "top","xyz","icu","click","rest","pw","work","loan","zip","cam","cfd","kim",
]);

function tldOf(host?: string | null): string | null {
  if (!host) return null;
  const parts = host.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

// Very simple brand/host “match” heuristic
function companyMatchesHost(company: string, host?: string | null): boolean {
  if (!company || !host) return true; // don’t penalize unknowns
  const c = norm(company).replace(/[^a-z0-9]/g, "");
  if (!c) return true;
  // check presence of company token in host (minus common prefixes)
  const h = host
    .replace(/^www\./, "")
    .replace(/[^a-z0-9.]/g, "");
  return h.includes(c);
}

/* ---------------- rules ---------------- */

type Rule = {
  key: string;
  label: string;
  explain: string;
  re: RegExp;
};

const HIGH: Rule[] = [
  {
    key: "upfront-fee",
    label: "Upfront fee",
    explain: "Asks you to pay fees, buy equipment, or prepay for onboarding.",
    re: rx("\\b(application fee|processing fee|upfront fee|pay.*equipment|buy.*equipment|training fee)\\b"),
  },
  {
    key: "payment-schemes",
    label: "Suspicious payments",
    explain: "Mentions crypto, wire, gift cards, Zelle/Cash App/Venmo for payment.",
    re: rx("\\b(crypto|bitcoin|wire transfer|gift ?cards?|zelle|cash app|venmo)\\b"),
  },
  {
    key: "check-scam",
    label: "Check to deposit",
    explain: "Sends a check to deposit, then asks you to return funds.",
    re: rx("\\b(cashier'?s? check|send.*back.*(money|funds))\\b"),
  },
  {
    key: "reshipping-mule",
    label: "Reshipping/parcel mule",
    explain: "Repack, reship, or receive packages at home.",
    re: rx("\\b(repack|reship|package handler from home|parcel agent)\\b"),
  },
  {
    key: "ssn-upfront",
    label: "SSN/W-4 upfront",
    explain: "Requests SSN/W-4 or sensitive identity info before hiring steps.",
    re: rx("\\b(ssn|social security|w-?4|driver'?s? license)\\b"),
  },
];

const MED: Rule[] = [
  {
    key: "free-mail",
    label: "Free email domain",
    explain: "Uses free email for ‘HR’ (gmail/outlook/yahoo/hotmail).",
    re: rx("\\b(gmail\\.com|outlook\\.com|yahoo\\.com|hotmail\\.com)\\b"),
  },
  {
    key: "urgent-hire",
    label: "Urgent/immediate hire",
    explain: "Pushy timeline (immediate/urgent/start today).",
    re: rx("\\b(immediate(ly)? hire|urgent|start today|hiring now)\\b"),
  },
  {
    key: "no-interview",
    label: "No interview",
    explain: "Promises job with no interview or instant approval.",
    re: rx("\\b(no interview|skip interview|instant approval|guaranteed job)\\b"),
  },
  {
    key: "off-platform",
    label: "Move off-platform",
    explain: "Push to chat on Telegram/WhatsApp/Signal/email.",
    re: rx("\\b(telegram|whatsapp|signal)\\b"),
  },
];

const LOW: Rule[] = [
  {
    key: "remote-hype",
    label: "Remote hype",
    explain: "Overemphasis on remote/flexible without details.",
    re: rx("\\b(100% remote|work from (home|anywhere)|flexible hours)\\b"),
  },
  {
    key: "vague-title",
    label: "Vague role",
    explain: "Very generic roles (assistant, clerk, data entry, typist).",
    re: rx("\\b(assistant|clerk|data entry|typist)\\b"),
  },
  {
    key: "benefits-hype",
    label: "Benefits hype",
    explain: "Unusual promises (free laptop, sign-on bonus, day-one benefits).",
    re: rx("\\b(free laptop|sign[- ]?on bonus|instant benefits|day one benefits)\\b"),
  },
];

/** Failsafe red flags that immediately force HIGH. */
const FAILSAFE_KEYS = new Set([
  "upfront-fee",
  "payment-schemes",
  "check-scam",
  "reshipping-mule",
  "ssn-upfront",
]);

/* ---------------- core scoring ---------------- */

export function scoreJob(input: ScoreInput): ScoreResult {
  const text = blob(input);
  const reasons: Reason[] = [];

  const addMatches = (rules: Rule[], severity: Severity) => {
    for (const r of rules) {
      if (has(text, r.re)) {
        reasons.push({ key: r.key, label: r.label, severity, explain: r.explain });
      }
    }
  };

  addMatches(HIGH, "high");
  addMatches(MED, "medium");
  addMatches(LOW, "low");

  // URL-based heuristics
  const host = hostOf(input.url);
  if (input.url && !looksHttps(input.url)) {
    reasons.push({
      key: "non-https",
      label: "Non-HTTPS URL",
      severity: "medium",
      explain: "Website does not use HTTPS.",
    });
  }
  const tld = tldOf(host);
  if (tld && SUSPICIOUS_TLDS.has(tld)) {
    reasons.push({
      key: "suspicious-tld",
      label: `Suspicious TLD (.${tld})`,
      severity: "medium",
      explain: "Domain ends with a high-risk top-level domain.",
    });
  }
  if (host && input.company && !companyMatchesHost(input.company, host)) {
    reasons.push({
      key: "brand-mismatch",
      label: "Brand/URL mismatch",
      severity: "medium",
      explain: "Company name and website domain don’t appear to match.",
    });
  }

  // Weighted points by severity (cumulative)
  const ptsHigh = 24;
  const ptsMed  = 12;
  const ptsLow  = 6;

  const countHigh = reasons.filter(r => r.severity === "high").length;
  const countMed  = reasons.filter(r => r.severity === "medium").length;
  const countLow  = reasons.filter(r => r.severity === "low").length;

  let raw =
    countHigh * ptsHigh +
    countMed  * ptsMed  +
    countLow  * ptsLow;

  // Combo bonus: fee + suspicious payment → very strong signal
  const hasFee   = reasons.some(r => r.key === "upfront-fee");
  const hasPay   = reasons.some(r => r.key === "payment-schemes");
  if (hasFee && hasPay) raw = Math.max(raw, 95);

  // Clamp range
  let score = Math.max(0, Math.min(100, raw));

  // Failsafe: any critical flag -> minimum 90
  const trippedFailsafe = reasons.some(r => FAILSAFE_KEYS.has(r.key));
  if (trippedFailsafe) score = Math.max(score, 90);

  return { score, reasons };
}

/* --------- buckets (visual) --------- */

// Stricter thresholds: HIGH ≥ 60, MED ≥ 40
export function numericBucket(score: number): Severity {
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Visual bucket that respects reasons:
 *  - Any HIGH reason → "high"
 *  - Any MED reason → at least "medium"
 *  - Otherwise by numeric thresholds
 */
export function visualBucket(resultOrScore: ScoreResult | number): Severity {
  const res: ScoreResult =
    typeof resultOrScore === "number" ? { score: resultOrScore, reasons: [] } : resultOrScore;

  const hasHigh = res.reasons.some(r => r.severity === "high");
  const hasMed  = res.reasons.some(r => r.severity === "medium");
  if (hasHigh) return "high";
  if (hasMed)  return "medium";
  return numericBucket(res.score);
}