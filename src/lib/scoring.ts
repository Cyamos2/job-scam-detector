// Stricter, conservative scoring with clear reasons + automatic buckets.

export type Severity = "low" | "medium" | "high";

export type Reason = {
  key: string;        // stable id for a rule
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

/** ---------- helpers ---------- */

const rx = (s: string, flags = "i") => new RegExp(s, flags);
const has = (text: string, re: RegExp) => re.test(text);

function blob(input: ScoreInput): string {
  return [
    input.title || "",
    input.company || "",
    input.url || "",
    input.notes || "",
  ]
    .join(" \n ")
    .toLowerCase();
}

/** ---------- rule sets ---------- */

type Rule = { key: string; label: string; explain: string; re: RegExp };

const HIGH: Rule[] = [
  {
    key: "upfront-fee",
    label: "Upfront fee",
    explain: "Asks you to pay fees or buy equipment.",
    re: rx("\\b(application fee|processing fee|upfront fee|pay.*equipment|buy.*equipment|training fee)\\b"),
  },
  {
    key: "payment-schemes",
    label: "Suspicious payments",
    explain: "Crypto/wire/gift cards/Zelle/Venmo for pay.",
    re: rx("\\b(crypto|bitcoin|wire transfer|gift ?cards?|zelle|cash app|venmo)\\b"),
  },
  {
    key: "check-scam",
    label: "Check to deposit",
    explain: "Sends a check to deposit and send money back.",
    re: rx("\\b(cashier'?s? check|send.*back.*(money|funds))\\b"),
  },
  {
    key: "too-good-pay",
    label: "Unrealistic pay",
    explain: "Pay far above market or daily payouts.",
    re: rx("\\b\\$?\\s?([3-9]\\d{2,}|[1-9]\\d{3,})\\b"),
  },
];

const MED: Rule[] = [
  {
    key: "free-mail",
    label: "Free email domain",
    explain: "Gmail/Outlook/Yahoo/Hotmail for HR.",
    re: rx("\\b(gmail\\.com|outlook\\.com|yahoo\\.com|hotmail\\.com)\\b"),
  },
  {
    key: "urgent-hire",
    label: "Urgent/immediate hire",
    explain: "Pushy timeline (start today, urgent).",
    re: rx("\\b(immediate(ly)? hire|urgent|start today|hiring now)\\b"),
  },
  {
    key: "no-interview",
    label: "No interview",
    explain: "Promises job w/ no interview or instant approval.",
    re: rx("\\b(no interview|skip interview|instant approval|guaranteed job)\\b"),
  },
  {
    key: "off-platform",
    label: "Move off platform",
    explain: "Push to Telegram/WhatsApp/Signal/email.",
    re: rx("\\b(telegram|whatsapp|signal)\\b"),
  },
];

const LOW: Rule[] = [
  {
    key: "remote-hype",
    label: "Remote hype",
    explain: "Overemphasis on remote/flexible work.",
    re: rx("\\b(100% remote|work from (home|anywhere)|flexible hours)\\b"),
  },
  {
    key: "vague-title",
    label: "Vague role",
    explain: "Generic roles (assistant, clerk) with little detail.",
    re: rx("\\b(assistant|clerk|data entry|typist)\\b"),
  },
  {
    key: "benefits-hype",
    label: "Benefits hype",
    explain: "Unusual promises (free laptop/sign-on bonus).",
    re: rx("\\b(free laptop|sign[- ]?on bonus|instant benefits|day one benefits)\\b"),
  },
];

const FAILSAFE_ANY = ["upfront-fee", "payment-schemes", "check-scam"];

/** ---------- scoring core ---------- */

export function scoreJob(input: ScoreInput): ScoreResult {
  const text = blob(input);
  const reasons: Reason[] = [];

  const add = (rules: Rule[], severity: Severity) => {
    for (const r of rules) if (has(text, r.re)) {
      reasons.push({ key: r.key, label: r.label, severity, explain: r.explain });
    }
  };

  add(HIGH, "high");
  add(MED, "medium");
  add(LOW, "low");

  const ptsHigh = 22, ptsMed = 12, ptsLow = 6;
  const cH = reasons.filter(r => r.severity === "high").length;
  const cM = reasons.filter(r => r.severity === "medium").length;
  const cL = reasons.filter(r => r.severity === "low").length;

  let score = cH * ptsHigh + cM * ptsMed + cL * ptsLow;

  if (reasons.some(r => FAILSAFE_ANY.includes(r.key))) score = Math.max(score, 80);

  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, reasons };
}

/** numeric thresholds */
export function numericBucket(score: number): Severity {
  if (score >= 55) return "high";   // raised medium→high cutoff
  if (score >= 35) return "medium";
  return "low";
}

/** visual bucket respects reasons (clamps low to medium if needed) */
export function visualBucket(x: ScoreResult | number): Severity {
  const res: ScoreResult = typeof x === "number" ? { score: x, reasons: [] } : x;
  if (res.reasons.some(r => r.severity === "high")) return "high";
  if (res.reasons.some(r => r.severity === "medium")) return "medium";
  return numericBucket(res.score);
}