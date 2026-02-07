// src/lib/scoring.ts
// Conservative job-scam scoring with explainable reasons + visual buckets.

export type Severity = "low" | "medium" | "high";

export type Reason = {
  key: string;        // stable id
  label: string;      // short chip label
  severity: Severity; // how bad it is
  explain: string;    // one-liner for report detail
};

export type ScoreInput = {
  title: string;
  company: string;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
};

export type ScoreResult = {
  score: number;     // 0..100
  reasons: Reason[];
};

export type ScoreResultExtended = ScoreResult & {
  confidence?: number; // 0..1
  evidence?: {
    domain?: string | null;
    domainCreatedAt?: string | null;
    domainAgeDays?: number | null;
  };
};

/* ---------------- helpers ---------------- */

const rx = (s: string, flags = "i") => new RegExp(s, flags);
const has = (text: string, re: RegExp) => re.test(text);

function norm(s?: string | null) {
  return (s ?? "").toLowerCase().trim();
}

function blob(input: ScoreInput): string {
  // one big searchable text
  return [input.title, input.company, input.location, input.url, input.notes]
    .map((x) => norm(x))
    .join("\n");
}

function hostOf(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function looksHttps(url?: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

const SUSPICIOUS_TLDS = new Set([
  "top","xyz","icu","click","rest","pw","work","loan","zip","cam","cfd","kim","mom","gq","ml",
  "ga","cf","tk","country","science","stream","quest","buzz","lol","shop","beauty","bond"
]);

function tldOf(host?: string | null): string | null {
  if (!host) return null;
  const parts = host.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

// naive brand/host check: ensure cleaned company token occurs in host
function companyMatchesHost(company: string, host?: string | null): boolean {
  if (!company || !host) return true; // unknown → neutral
  const c = norm(company).replace(/[^a-z0-9]/g, "");
  if (!c) return true;
  const h = host.replace(/^www\./, "").replace(/[^a-z0-9.]/g, "");
  return h.includes(c);
}

/* ---------------- rules ---------------- */

// phrases that strongly imply the role MUST be on-site
const IMPOSSIBLE_REMOTE_ROLES =
  "(warehouse|forklift|stock( clerk)?|retail (associate|cashier|sales)|barista|server|waiter|waitress|bartender|line cook|cook|chef|dishwasher|housekeep(?:er|ing)|janitor|custodian|groundskeep(?:er|ing)|landscap(?:er|ing)|maintenance (tech|worker)?|security guard|bouncer|construction|roofer|welder|carpenter|plumber|electrician|hvac|field service|installer|cable (tech|installer)|fiber (tech|installer)|lineman|material handler|picker|packer|machine operator|assembler|production worker|manufacturing (associate|tech)|quality inspector|delivery (driver|courier)|cdl|truck (driver|driving)|postal (carrier|worker)|mail carrier|rideshare|uber|lyft|airline|pilot|flight attendant|gate agent|ramp agent|baggage handler|aircraft (mechanic|avionics)|bus driver|train conductor|auto (tech|mechanic)|body shop|nail tech|hair stylist|barber|esthetician|massage therapist|personal trainer|childcare|daycare|elder care|cna|home health aide|veterinary (assistant|technician)|dental (assistant|hygienist)|phlebotomist|radiology tech|ultrasound tech|x-?ray tech)";

// “remote” vocabulary (order matters a bit)
const REMOTE_WORDS = "(remote|work[ -]?from[ -]?home|wfh|anywhere)";

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
    re: rx("\\b(application|processing|training|onboarding) fee\\b|\\bbuy .*equipment\\b"),
  },
  {
    key: "payment-schemes",
    label: "Suspicious payments",
    explain: "Mentions crypto, wire, gift cards, Zelle/Cash App/Venmo for payment.",
    re: rx("\\b(crypto|bitcoin|wire transfer|gift ?cards?|zelle|cash ?app|venmo)\\b"),
  },
  {
    key: "check-scam",
    label: "Check to deposit",
    explain: "Sends a check to deposit, then asks you to return funds.",
    re: rx("\\b(cashier'?s? check|send (back|return) (money|funds))\\b"),
  },
  {
    key: "reshipping-mule",
    label: "Reshipping/parcel mule",
    explain: "Repack, reship, or receive packages at home.",
    re: rx("\\b(repack|reship|parcel agent|package handler from home)\\b"),
  },
  {
    key: "ssn-upfront",
    label: "SSN/W-4 upfront",
    explain: "Requests SSN/W-4 or sensitive ID before legitimate hiring steps.",
    re: rx("\\b(ssn|social security|w-?4|driver'?s? license)\\b"),
  },
  // New: impossible-remote guardrail
  {
    key: "impossible-remote",
    label: "Remote claim for on-site role",
    explain: "Role requires physical presence (e.g., warehouse, retail, driver, bedside healthcare).",
    re: rx(`\\b(?:${REMOTE_WORDS})\\b[\\s\\S]{0,80}\\b(?:${IMPOSSIBLE_REMOTE_ROLES})\\b|\\b(?:${IMPOSSIBLE_REMOTE_ROLES})\\b[\\s\\S]{0,80}\\b(?:${REMOTE_WORDS})\\b`),
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
    re: rx("\\b(telegram|whats ?app|signal)\\b"),
  },
  {
    key: "short-link",
    label: "Shortened link",
    explain: "Uses a URL shortener (bit.ly, tinyurl, etc.).",
    re: rx("\\b(bit\\.ly|tinyurl\\.com|t\\.co|is\\.gd|rb\\.gy|rebrand\\.ly)\\/"),
  },
  {
    key: "overpay-entry",
    label: "Too-good pay for entry",
    explain: "Unusually high hourly pay with 'no experience' or very generic roles.",
    re: rx("\\$\\s?([4-9]\\d)\\s?\\/?\\s?(hr|hour)\\b[\\s\\S]{0,80}\\b(no experience|required:? ?none|data entry|assistant)"),
  },
];

const LOW: Rule[] = [
  {
    key: "remote-hype",
    label: "Remote hype",
    explain: "Overemphasis on remote/flexible without details.",
    re: rx(`\\b(${REMOTE_WORDS}|flexible hours|work from anywhere)\\b`),
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
    re: rx("\\b(free laptop|sign[- ]?on bonus|instant benefits|day ?one benefits)\\b"),
  },
];

/** Triggers that force HIGH floor if present. */
const FAILSAFE_KEYS = new Set([
  "upfront-fee",
  "payment-schemes",
  "check-scam",
  "reshipping-mule",
  "ssn-upfront",
  "impossible-remote",
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

  // ---- URL-based heuristics
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

  // ---- Scoring (weighted rule engine)
  // Default weights (can tune per rule in future)
  const defaultWeights = { high: 28, medium: 13, low: 6 };

  const detailed = reasons.map(r => {
    const weight = r.severity === "high" ? defaultWeights.high : r.severity === "medium" ? defaultWeights.medium : defaultWeights.low;
    return { ...r, weight };
  });

  // Basic aggregation
  const raw = detailed.reduce((s, r) => s + r.weight, 0);

  // Combo bonuses (very common scam patterns)
  const hasFee2 = detailed.some(r => r.key === "upfront-fee");
  const hasPay2 = detailed.some(r => r.key === "payment-schemes");
  const hasCheck2 = detailed.some(r => r.key === "check-scam");
  let adj = raw;
  if ((hasFee2 && hasPay2) || (hasCheck2 && hasPay2)) adj = Math.max(adj, 120);

  // Normalize to 0..100 (assume max useful raw ~140)
  let score = Math.max(0, Math.min(100, Math.round((adj / 140) * 100)));

  // Failsafe: presence of a critical red flag → minimum 90
  if (reasons.some(r => FAILSAFE_KEYS.has(r.key))) score = Math.max(score, 90);

  return { score, reasons };
}

/* --------- async enriched scoring (WHOIS) --------- */
import api from "./db";

export async function scoreJobEnriched(input: ScoreInput): Promise<ScoreResultExtended> {
  const base = scoreJob(input);
  const res: ScoreResultExtended = { ...base };

  // If there is a URL, attempt WHOIS lookup for domain age
  const host = hostOf(input.url);
  if (!host) return res;

  try {
    const who = await api.whois(host);
    if (who) {
      res.evidence = res.evidence ?? {};
      res.evidence.domain = who.domain;
      res.evidence.domainCreatedAt = who.createdAt ?? null;
      res.evidence.domainAgeDays = who.ageDays ?? null;

      // If domain age is known and < 90 days, add a strong reason
      if (who.ageDays != null && who.ageDays < 90) {
        const r: Reason = {
          key: "young-domain",
          label: "Young domain",
          severity: "high",
          explain: `Domain was registered ${who.ageDays} days ago.`,
        };
        // avoid duplicate
        if (!res.reasons.some(x => x.key === r.key)) res.reasons.push(r);
      }

      // Recompute score using same weighted engine
      const defaultWeights = { high: 28, medium: 13, low: 6 };
      const detailed = res.reasons.map(r => {
        const weight = r.severity === "high" ? defaultWeights.high : r.severity === "medium" ? defaultWeights.medium : defaultWeights.low;
        return { ...r, weight };
      });

      let raw = detailed.reduce((s, r) => s + r.weight, 0);
      if (detailed.some(r => r.key === "upfront-fee") && detailed.some(r => r.key === "payment-schemes")) raw = Math.max(raw, 120);
      let score = Math.max(0, Math.min(100, Math.round((raw / 140) * 100)));
      if (res.reasons.some(r => FAILSAFE_KEYS.has(r.key))) score = Math.max(score, 90);
      res.score = score;

      // Confidence: simple heuristic (more weight → higher confidence)
      res.confidence = Math.min(1, raw / 160);
    }
  } catch (e) {
    // ignore; keep base result
  }

  return res;
}

/* --------- buckets (visual) --------- */

// Thresholds: HIGH ≥ 60, MED ≥ 40
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