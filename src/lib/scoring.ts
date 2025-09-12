// Stricter, conservative scoring with clear reasons + buckets.

export type Severity = "low" | "medium" | "high";

export type Reason = {
  key: string;        // stable id (also used as "code")
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

/* -------------------- helpers -------------------- */
const rx = (s: string, flags = "i") => new RegExp(s, flags);
const has = (text: string, re: RegExp) => re.test(text);
const safeLower = (s?: string) => (s ?? "").toLowerCase();

function blob(input: ScoreInput): string {
  return [
    input.title ?? "",
    input.company ?? "",
    input.url ?? "",
    input.notes ?? "",
  ].join(" \n ").toLowerCase();
}

function urlTld(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.hostname.split(".");
    return parts.length >= 2 ? parts[parts.length - 1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/* -------------------- rules -------------------- */

type Rule = {
  key: string; label: string; explain: string; re: RegExp;
};

/** HIGH red flags */
const HIGH: Rule[] = [
  {
    key: "upfront_fee",
    label: "Upfront fee",
    explain: "Asks you to pay fees, buy equipment, or prepay for onboarding.",
    re: rx("\\b(application|processing|onboarding|training) fee\\b|\\b(pay|buy).*equipment\\b"),
  },
  {
    key: "suspicious_payment",
    label: "Suspicious payments",
    explain: "Mentions crypto, gift cards, Zelle/Cash App, or wire transfers.",
    re: rx("\\b(crypto|bitcoin|gift ?cards?|zelle|cash ?app|venmo|wire transfer)\\b"),
  },
  {
    key: "check_mule",
    label: "Check to deposit",
    explain: "Sends a check to deposit and asks you to forward money.",
    re: rx("\\b(cashier'?s? check|send.*back.*(money|funds)|deposit.*check)\\b"),
  },
  {
    key: "unreal_pay",
    label: "Unrealistic pay",
    explain: "Pay far above market or guaranteed high daily income.",
    re: rx("\\b\\$\\s?([3-9]\\d{2,}|[1-9]\\d{3,})\\b|\\b\\$(300|500|700)\\s?per\\s?(day|shift)\\b"),
  },
];

/** MED red flags */
const MED: Rule[] = [
  {
    key: "phone_in_body",
    label: "Phone number included",
    explain: "Phone number embedded directly in description.",
    re: rx("(\\+?\\d[\\s-]?){7,}"),
  },
  {
    key: "messaging_app",
    label: "Asks to contact via messaging app",
    explain: "Push to move chat to WhatsApp/Telegram/Signal/email.",
    re: rx("\\b(telegram|whatsapp|signal)\\b"),
  },
  {
    key: "urgent_hire",
    label: "Urgent/immediate hire",
    explain: "Pushy timeline: immediate hire, start today.",
    re: rx("\\b(immediate(ly)? hire|urgent|start today|hiring now)\\b"),
  },
  {
    key: "no_interview",
    label: "No interview promised",
    explain: "Promises job with no interview or instant approval.",
    re: rx("\\b(no interview|skip interview|instant approval|guaranteed job)\\b"),
  },
  {
    key: "weekly_cash",
    label: "Cash/daily/weekly pay callout",
    explain: "Emphasis on daily/weekly cash or instant payouts.",
    re: rx("\\b(daily|weekly) (cash|pay)\\b|\\bpaid (daily|instantly)\\b"),
  },
  {
    key: "suspicious_tld",
    label: "Suspicious domain",
    explain: "Uses uncommon or low-reputation TLD.",
    // handled via URL check below (no regex hit needed)
    re: rx("$^"), // never matches; we manually add this reason if TLD matches set.
  },
];

/** LOW signals */
const LOW: Rule[] = [
  {
    key: "remote_hype",
    label: "Remote hype",
    explain: "Overemphasis on remote/flexible work without details.",
    re: rx("\\b(100% remote|work from (home|anywhere)|flexible hours)\\b"),
  },
  {
    key: "vague_title",
    label: "Vague role",
    explain: "Very generic roles (assistant, clerk) with little detail.",
    re: rx("\\b(assistant|clerk|data entry|typist)\\b"),
  },
  {
    key: "exclamations",
    label: "Excessive exclamation",
    explain: "Overuse of exclamation marks indicating hype.",
    re: rx("!{3,}"),
  },
  {
    key: "no_experience",
    label: "No experience required",
    explain: "Implies anyone qualifies immediately.",
    re: rx("\\b(no experience (necessary|required))\\b"),
  },
];

/** Failsafe keys: any of these force HIGH; combos push higher. */
const FAILSAFES = new Set([
  "upfront_fee",
  "suspicious_payment",
  "check_mule",
]);

/* -------------------- scoring core -------------------- */

export function scoreJob(input: ScoreInput): ScoreResult {
  const text = blob(input);
  const reasons: Reason[] = [];

  // Pattern matches
  const addMatches = (rules: Rule[], severity: Severity) => {
    for (const r of rules) {
      if (r.key === "suspicious_tld") continue; // special handling below
      if (has(text, r.re)) reasons.push({ key: r.key, label: r.label, severity, explain: r.explain });
    }
  };
  addMatches(HIGH, "high");
  addMatches(MED, "medium");
  addMatches(LOW, "low");

  // Suspicious TLDs via URL parse (safer than regex on blob)
  const badTlds = new Set(["top", "xyz", "icu", "best", "loan", "work", "tk", "click", "buzz", "biz"]);
  const tld = urlTld(input.url);
  if (tld && badTlds.has(tld)) {
    reasons.push({
      key: "suspicious_tld",
      label: "Suspicious TLD",
      severity: "medium",
      explain: `Domain ends with .${tld}`,
    });
  }

  // Compute weighted score
  const numHigh = reasons.filter(r => r.severity === "high").length;
  const numMed  = reasons.filter(r => r.severity === "medium").length;
  const numLow  = reasons.filter(r => r.severity === "low").length;

  // Base weights (slightly stricter)
  const W_HIGH = 24;
  const W_MED  = 12;
  const W_LOW  = 5;

  let raw =
    numHigh * W_HIGH +
    numMed  * W_MED  +
    numLow  * W_LOW;

  // Escalation: multiple high factors compound the risk
  if (numHigh >= 2) raw += 10 + (numHigh - 2) * 6; // 2 highs +10, each extra +6

  // Diversity bonus: many different signals across severities
  const kinds = (numHigh ? 1 : 0) + (numMed ? 1 : 0) + (numLow ? 1 : 0);
  raw += Math.min(12, kinds * 4); // up to +12

  // Clamp and failsafes
  let score = Math.max(0, Math.min(100, Math.round(raw)));

  // Any critical failsafe → at least 80; powerful combos → ≥90
  const trippedFailsafe = reasons.some(r => FAILSAFES.has(r.key));
  if (trippedFailsafe) score = Math.max(score, 80);
  if (reasons.some(r => r.key === "upfront_fee") && reasons.some(r => r.key === "suspicious_payment")) {
    score = Math.max(score, 95);
  }

  return { score, reasons };
}

/* -------------------- buckets -------------------- */

export function numericBucket(score: number): Severity {
  // High is stricter
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  return "low";
}

/**
 * Visual bucket that also respects reasons:
 *  - Any HIGH reason → "high"
 *  - Else any MED reason → "medium"
 *  - Else by numeric thresholds
 */
export function visualBucket(resultOrScore: ScoreResult | number): Severity {
  const result: ScoreResult =
    typeof resultOrScore === "number" ? { score: resultOrScore, reasons: [] } : resultOrScore;

  const hasHigh = result.reasons.some(r => r.severity === "high");
  const hasMed  = result.reasons.some(r => r.severity === "medium");

  if (hasHigh) return "high";
  if (hasMed)  return "medium";
  return numericBucket(result.score);
}

/* -------------------- utilities -------------------- */

// Stable sorter for display: High→Med→Low, then label
export function sortReasons(reasons: Reason[]): Reason[] {
  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return [...reasons].sort((a, b) =>
    rank[a.severity] - rank[b.severity] || a.label.localeCompare(b.label)
  );
}