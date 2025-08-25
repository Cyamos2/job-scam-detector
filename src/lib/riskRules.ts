// src/lib/riskRules.ts
// Fuzzy, regex + proximity based risk detector for job post text.

export type RiskMatch = {
  label: string;
  weight: number;
  hit: string;        // the exact thing that triggered
  snippet: string;    // short context around the hit
  advice?: string;
};

export type Analysis = {
  score: number;                      // 0–100
  level: "Low" | "Medium" | "High";
  matches: RiskMatch[];
};

/* -------------------------- Normalization helpers -------------------------- */

/** Common misspellings we see in scammy posts */
const MISSPELLINGS: Record<string, string> = {
  aply: "apply",
  aplly: "apply",
  aplicat: "apply",
  traning: "training",
  backgroud: "background",
  verfication: "verification",
  intervew: "interview",
  insarance: "insurance",
  heath: "health",
  emial: "email",
  compnay: "company",
  watsapp: "whatsapp",
  telegran: "telegram",
  uz: "us",
};

function stripDiacritics(s: string) {
  try {
    return s.normalize("NFKD").replace(/\p{Diacritic}+/gu, "");
  } catch {
    return s;
  }
}

/** Clean & standardize text but keep it readable for snippets */
function normalize(raw: string) {
  let t = stripDiacritics(raw)
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // unify currency symbols and amounts
    .replace(/[€£]/g, "$")
    .replace(/\$\s*(\d+)/g, (_, n) => `$${n}`) // "$ 500" -> "$500"
    .replace(/\$\s*\$\s*\$/g, "$$$")           // "$ $ $" -> "$$$"
    // email obfuscations
    .replace(/\b\(dot\)|\[dot\]|{dot}| dot /g, ".")
    .replace(/\b\(at\)|\[at\]|{at}| at /g, "@")
    // collapse whitespace
    .replace(/\s+/g, " ")
    .trim();

  // quick typo fixes
  for (const [bad, good] of Object.entries(MISSPELLINGS)) {
    t = t.replace(new RegExp(`\\b${bad}\\b`, "g"), good);
  }
  return t;
}

/** Build short context around a match (on normalized text) */
function snippetAround(text: string, idx: number, len: number, pad = 48) {
  const s = Math.max(0, idx - pad);
  const e = Math.min(text.length, idx + len + pad);
  return text.slice(s, e);
}

/** Return all matches of a regex with snippets (guarantees global search) */
function findAll(text: string, rx: RegExp) {
  const out: Array<{ hit: string; snippet: string; index: number }> = [];
  const g = new RegExp(rx.source, rx.flags.includes("g") ? rx.flags : rx.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = g.exec(text))) {
    out.push({ hit: m[0], snippet: snippetAround(text, m.index, m[0].length), index: m.index });
  }
  return out;
}

/* ------------------------------- Rules engine ------------------------------ */

type RegexRule = {
  type: "regex";
  label: string;
  weight: number;
  advice?: string;
  patterns: RegExp[];
};

type Rule = RegexRule;

/** All rules. Add or tune weights freely. */
const RULES: Rule[] = [
  /* --- Pay-to-work / upfront fees / deposits --- */
  {
    type: "regex",
    label: "Upfront fee / pay to apply",
    weight: 25,
    advice: "Legit employers don’t charge you to apply, onboard, or run background checks.",
    patterns: [
      /\b(application|training|background|onboarding|processing)\s+fee\b/i,
      /\bpay\b.{0,20}\b(fee|deposit|training|background|processing)\b/i,
      /\b(fee|deposit|charge)\b.{0,12}\$\d+/i,
      /\$\d+\s*(to|for)\s*(apply|application)/i,       // "$500 to apply"
      /\bpay\s*\$\$+\b/i,                              // "pay $$$"
      /\b(pay|send|transfer)\b.{0,12}\$\d+/i,          // "pay $50"
    ],
  },

  /* --- Unusual payment rails --- */
  {
    type: "regex",
    label: "Unusual payment method (gift cards / crypto / P2P apps)",
    weight: 20,
    advice: "Avoid employers asking for money via gift cards, crypto, or P2P apps.",
    patterns: [
      /\bgift\s*cards?\b/i,
      /\b(cryptocurrency|crypto|bitcoin|btc|eth|usdt|stablecoin)\b/i,
      /\b(cashapp|cash app|venmo|zelle|paypal)\b/i,
      /\b(western\s*union|moneygram)\b/i,
    ],
  },

  /* --- Off-platform chat “interviews” --- */
  {
    type: "regex",
    label: "Interview exclusively on chat apps",
    weight: 15,
    advice: "Legit orgs rarely do the entire interview only on chat apps.",
    patterns: [/\b(telegram|whatsapp|signal|google\s*chat|facebook\s*messenger)\b/i],
  },

  /* --- Fake check + equipment purchase --- */
  {
    type: "regex",
    label: "Check deposit / buy equipment scheme",
    weight: 24,
    advice: "“We’ll send a cashier’s check, then buy equipment” is a classic scam.",
    patterns: [
      /\bcashier'?s?\s*check\b/i,
      /\b(send|mail)\s+you\s+a\s+check\b/i,
      /\bdeposit\b.{0,20}\bcheck\b/i,
      /\b(purchase|buy|order)\b.{0,30}\b(laptop|home\s*office|equipment|materials|software|tools?|workstation)\b/i,
    ],
  },

  /* --- Sensitive personal/banking data --- */
  {
    type: "regex",
    label: "Requests for SSN/bank/ID images",
    weight: 20,
    advice: "Never share bank details or ID images before an official offer.",
    patterns: [
      /\b(ssn|social\s*security)\b/i,
      /\b(routing|account)\s+number\b/i,
      /\b(front|back)\s+of\s+(id|driver'?s?\s*license|passport)\b/i,
    ],
  },

  /* --- Free email domain / obfuscated contact --- */
  {
    type: "regex",
    label: "Contact via free email domain",
    weight: 18,
    advice: "Legit companies use official domains, not free email providers.",
    patterns: [
      /\b[A-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com\b/i,
      /\b(contact|email|apply).{0,12}@?(gmail|yahoo|outlook|hotmail)\s*(\.| dot )\s*com\b/i, // obfuscated
    ],
  },

  /* --- Urgency / no interview --- */
  {
    type: "regex",
    label: "Immediate start / no interview",
    weight: 12,
    patterns: [/\b(start (immediately|today)|urgent hire|no interview required|instant hire|hired on the spot)\b/i],
  },

  /* --- Too-good-to-be-true simple roles --- */
  {
    type: "regex",
    label: "Very high pay for simple work",
    weight: 16,
    advice: "Inflated pay for data entry/typist roles is a strong red flag.",
    patterns: [
      // $60/hr+ near data entry-ish roles
      /\$\s?(4|5|6|7|8|9)\d\b.{0,40}\b(per hour|\/hr|hr)\b.{0,40}\b(data entry|typist|remote assistant)\b/i,
      // $200–$500 per day near simple roles
      /\b(200|300|400|500)\s*(per\s*day|\/day)\b.{0,40}\b(data entry|typist|remote assistant)\b/i,
    ],
  },

  /* --- Buy-your-own “home office package” --- */
  {
    type: "regex",
    label: "Work-from-home package purchase",
    weight: 12,
    advice: "Asking you to buy gear up front is commonly fraudulent.",
    patterns: [
      /\b(home\s*office|workstation|tools?)\b.{0,40}\b(purchase|buy|ship|send)\b/i,
    ],
  },
];

/* ------------------------------- Analyzer API ------------------------------ */

/**
 * Analyze a job post or description text and return a score & matches.
 * Scoring: sum of rule weights (each occurrence counts), softened and clamped to 100.
 */
export function analyzeText(rawText: string): Analysis {
  const text = normalize(rawText);
  const matches: RiskMatch[] = [];
  let score = 0;

  for (const rule of RULES) {
    if (rule.type === "regex") {
      for (const rx of rule.patterns) {
        const hits = findAll(text, rx);
        for (const h of hits) {
          score += rule.weight;
          matches.push({
            label: rule.label,
            weight: rule.weight,
            hit: h.hit,
            snippet: h.snippet,
            advice: rule.advice,
          });
        }
      }
    }
  }

  // Soft-cap score growth (multiple hits shouldn't rocket to 300)
  score = Math.min(100, Math.round(score * 0.7));

  const level: Analysis["level"] = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";
  return { score, level, matches };
}