// src/lib/scoring.ts
// Heuristic scam scoring with multi-reason explanations.
// (Stronger & more sensitive. Now catches phrases like “non-corp email”.)

import type { Job } from "../lib/api";

export type Reason = {
  key: string;
  label: string;
  tip?: string;
  points: number;
};

type Rule = {
  key: string;
  label: string;
  points: number;
  test: (t: string, job: Job) => boolean;
  tip?: string;
};

// ---------- helpers ----------
const kw = (words: string[]) => {
  const arr = words.map(w => w.toLowerCase());
  return (t: string) => arr.some(w => t.includes(w));
};

const FREE_EMAIL = /@(gmail|yahoo|outlook|hotmail|protonmail)\.com/i;
const FREE_EMAIL_PHRASE =
  /(non[-\s]?corp(orat(e|ion))?\s*email|personal\s*email|free\s*email)/i;

const ODD_TLD =
  /\.(top|xyz|buzz|click|work|win|live|bid|loan|download|men|ml|ga|cf|shop|rest)(\/|$)/i;

const SHORTENERS = /(bit\.ly|t\.co|tinyurl\.com|goo\.gl|is\.gd|cutt\.ly|rb\.gy)\//i;
const BIG_MONEY = /\b(\$|usd)\s?\d{3,}\b/i; // $200, $1500
const RATE_RANGE = /\$\d{2,4}\s*[-–]\s*\$\d{2,4}\/?(day|hr|hour|week)?/i;

const IM_ONLY = /(telegram|whatsapp|wechat)\s*(only|preferred|dm|contact)/i;
const PHONE_ONLY = /(text\s+me|sms\s+only|text\s+only|text\s+to\s+\d)/i;

const WIRE_GIFT =
  /(gift\s*card|wire\s*transfer|zelle|western\s*union|moneygram|cashapp|venmo)/i;

const UPFRONT_FEE =
  /(upfront\s*fee|processing\s*fee|application\s*fee|equipment\s*fee|pay\s*to\s*apply|verification\s*fee)/i;

const URGENT =
  /(urgent\s*hire|immediate\s*start|start\s*today|limited\s*spots|act\s*now)/i;

const NO_EXP = /(no\s*experience|training\s*provided|easy\s*task|quick\s*money)/i;

const MANY_EXCLAIMS = /!{3,}/; // “!!!”
const ALL_CAPS_TITLE = /^[^a-z]{6,}$/; // shouty titles

function textOf(job: Job): string {
  return [
    job.title ?? "",
    job.company ?? "",
    job.url ?? "",
    job.notes ?? "",
  ].join(" ").toLowerCase();
}

// ---------- rules ----------
const RULES: Rule[] = [
  // high impact
  {
    key: "wire_gift",
    label: "Unusual payment",
    points: 30,
    test: (t) => WIRE_GIFT.test(t),
    tip: "Requests for gift cards, Zelle, or wire transfers are classic scam tells.",
  },
  {
    key: "upfront_fee",
    label: "Upfront fee",
    points: 25,
    test: (t) => UPFRONT_FEE.test(t),
    tip: "Legit employers don’t charge you to apply, train, or buy equipment.",
  },
  {
    key: "im_contact",
    label: "IM contact",
    points: 20,
    test: (t) => IM_ONLY.test(t),
    tip: "Moving to Telegram/WhatsApp hides identities and evades platforms.",
  },

  // medium impact
  {
    key: "big_money",
    label: "High pay mention",
    points: 12,
    test: (t) => BIG_MONEY.test(t) || RATE_RANGE.test(t),
    tip: "Excessive or flashy pay claims are commonly used as bait.",
  },
  {
    key: "shortener",
    label: "Link shortener",
    points: 12,
    test: (t) => SHORTENERS.test(t),
    tip: "URL shorteners can conceal malicious links.",
  },
  {
    key: "odd_tld",
    label: "Suspicious domain",
    points: 12,
    test: (_t, job) => !!job.url && ODD_TLD.test(job.url),
    tip: "Odd/throwaway TLDs (e.g., .top, .xyz) are common in scams.",
  },
  {
    key: "free_email",
    label: "Free email domain",
    points: 12,
    test: (t, job) =>
      (FREE_EMAIL.test(t) || FREE_EMAIL_PHRASE.test(t)) &&
      /(inc|ltd|llc|corp|co\.)/i.test(job.company ?? ""),
    tip: "Company claims a corporate entity but uses a personal/non-corp email.",
  },
  {
    key: "phone_only",
    label: "Text/SMS only",
    points: 10,
    test: (t) => PHONE_ONLY.test(t),
    tip: "“Text/SMS only” avoids platform audits and reduces accountability.",
  },

  // lighter signals
  {
    key: "urgent",
    label: "Urgent/limited",
    points: 8,
    test: (t) => URGENT.test(t),
    tip: "Artificial urgency pressures quick decisions.",
  },
  {
    key: "no_exp",
    label: "No experience",
    points: 6,
    test: (t) => NO_EXP.test(t),
  },
  {
    key: "shouty_title",
    label: "Shouty title",
    points: 5,
    test: (_t, job) => !!job.title && ALL_CAPS_TITLE.test(job.title),
  },
  {
    key: "many_exclaims",
    label: "Overuse of !!!",
    points: 5,
    test: (t) => MANY_EXCLAIMS.test(t),
  },
];

export function scoreJob(job: Job): { score: number; reasons: Reason[] } {
  const t = textOf(job);
  let score = 0;
  const reasons: Reason[] = [];

  for (const rule of RULES) {
    if (rule.test(t, job)) {
      score += rule.points;
      reasons.push({
        key: rule.key,
        label: rule.label,
        tip: rule.tip,
        points: rule.points,
      });
    }
  }

  // declared risk nudge
  if (job.risk === "medium") score += 10;
  if (job.risk === "high") score += 25;

  score = Math.max(0, Math.min(100, score));

  // de-dup
  const seen = new Set<string>();
  const uniq = reasons.filter(r => (seen.has(r.key) ? false : (seen.add(r.key), true)));

  return { score, reasons: uniq };
}

export function bucket(score: number): "low" | "medium" | "high" {
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
}