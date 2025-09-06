// src/lib/scoring.ts
// Stricter, weighted heuristic scorer with structured reasons

// ---------- Types ----------

export type Severity = "low" | "medium" | "high";

export type Reason = {
  key: string;        // stable id (e.g. "wire-transfer")
  label: string;      // short chip text (e.g. "Wire transfer")
  severity: Severity; // how bad it is
  explain: string;    // one-line explanation for bullets
};

export type ScoreResult = {
  score: number;      // 0..100
  reasons: Reason[];  // deduped reasons
};

// Input shape the UI already sends (AddContentScreen) and our Job objects map to
export type ScoreInput = {
  title?: string;
  company?: string;
  url?: string | undefined;
  notes?: string | undefined;
  risk?: "low" | "medium" | "high";
};

// ---------- Keyword packs (tune freely) ----------

// Very strong red flags (each +30~40)
const STRONG: Array<{ key: string; label: string; rx: RegExp; pts: number }> = [
  { key: "wire-transfer",   label: "Wire transfer",   rx: /\bwire\s*transfer\b/i, pts: 40 },
  { key: "gift-cards",      label: "Gift cards",      rx: /\bgift\s*card(s)?\b/i, pts: 40 },
  { key: "crypto",          label: "Crypto/Bitcoin",  rx: /\b(crypto|bitcoin|btc)\b/i, pts: 35 },
  { key: "zelle-cashapp",   label: "Zelle/CashApp",   rx: /\b(zelle|cash(\s*)?app)\b/i, pts: 35 },
  { key: "pay-to-apply",    label: "Upfront fee",     rx: /\b(upfront|processing|application)\s*fee\b/i, pts: 35 },
  { key: "telegram-only",   label: "Telegram/WhatsApp only", rx: /\b(telegram|whats\s*app)\s*(only|support)?\b/i, pts: 30 },
];

// Medium indicators (each +12~20)
const MEDIUM: Array<{ key: string; label: string; rx: RegExp; pts: number }> = [
  { key: "urgent-hire",     label: "Urgent hire",        rx: /\burgent(ly)?\s*hire|immediate\s*start\b/i, pts: 20 },
  { key: "no-experience",   label: "No experience",      rx: /\bno\s*experience\b/i, pts: 15 },
  { key: "high-pay",        label: "Unusually high pay", rx: /\b(\$|usd)\s?\d{4,}\b/i, pts: 18 }, // $1000+ mention
  { key: "weekly-payout",   label: "Weekly payout",      rx: /\b(weekly|daily)\s*payout\b/i, pts: 15 },
  { key: "training-provided", label: "Training provided", rx: /\btraining\s*provided\b/i, pts: 12 },
  { key: "quick-task",      label: "Quick tasks",        rx: /\bquick\s*task(s)?\b/i, pts: 12 },
  { key: "social-evaluator",label: "Social media eval",  rx: /\bsocial\s*media\s*evaluat(or|ion)\b/i, pts: 12 },
];

// Weak signals (each +6~8)
const WEAK: Array<{ key: string; label: string; rx: RegExp; pts: number }> = [
  { key: "flexible-hours",  label: "Flexible hours",    rx: /\bflexible\s*hours?\b/i, pts: 6 },
  { key: "bonus",           label: "Bonus/Commission",  rx: /\b(bonus|commission)\b/i, pts: 6 },
  { key: "sign-on",         label: "Sign-on bonus",     rx: /\bsign[-\s]*on\s*bonus\b/i, pts: 8 },
];

// Shorteners (avoid obscured links) (+10 each)
const SHORTENERS = /\b(goo\.gl|bit\.ly|bitly\.com|t\.co|tinyurl\.com|lnkd\.in)\b/i;

// Free email domains (paired with “company-like” names) (+22)
const FREE_MAIL = /\b@gmail\.com|@outlook\.com|@yahoo\.com|@hotmail\.com\b/i;
// Company-like suffixes in company name
const CO_SUFFIX = /\b(inc\.?|ltd\.?|llc|corp\.?)\b/i;

// URL looks suspicious: scheme missing parts / malformed TLDs (mild) (+10)
const SUSP_URL = /\bhttps?:\/\/[^\s]+\.[a-z]{1,2}(\/|$)/i; // overly short TLDs

// “Remote-only” hype (+8)
const REMOTE_HYPE = /\b(remote\s*only|work\s*from\s*home)\b/i;

// ---------- Utilities ----------

function textOf(input: ScoreInput): string {
  return [
    input.title ?? "",
    input.company ?? "",
    input.url ?? "",
    input.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function addReason(
  list: Reason[],
  set: Set<string>,
  r: Reason,
  addPts: (n: number) => void,
  pts: number
) {
  if (set.has(r.key)) return; // dedupe per key
  set.add(r.key);
  list.push(r);
  addPts(pts);
}

function mkReason(
  key: string,
  label: string,
  severity: Severity,
  explain: string
): Reason {
  return { key, label, severity, explain };
}

// ---------- Main API ----------

/** Compute a 0..100 score and structured reasons */
export function scoreJob(job: ScoreInput): ScoreResult {
  const t = textOf(job);
  let total = 0;
  const reasons: Reason[] = [];
  const seen = new Set<string>();
  const addPts = (n: number) => {
    total += n;
  };

  // Strong signals
  for (const k of STRONG) {
    if (k.rx.test(t)) {
      addReason(
        reasons,
        seen,
        mkReason(k.key, k.label, "high", `Mentions ${k.label.toLowerCase()}.`),
        addPts,
        k.pts
      );
    }
  }

  // Medium signals
  for (const k of MEDIUM) {
    if (k.rx.test(t)) {
      addReason(
        reasons,
        seen,
        mkReason(k.key, k.label, "medium", `Contains ${k.label.toLowerCase()}.`),
        addPts,
        k.pts
      );
    }
  }

  // Weak signals
  for (const k of WEAK) {
    if (k.rx.test(t)) {
      addReason(
        reasons,
        seen,
        mkReason(k.key, k.label, "low", `Includes ${k.label.toLowerCase()}.`),
        addPts,
        k.pts
      );
    }
  }

  // Link shorteners
  if (SHORTENERS.test(t)) {
    addReason(
      reasons,
      seen,
      mkReason(
        "short-links",
        "Link shortener",
        "medium",
        "Uses a link shortener (can obscure destination)."
      ),
      addPts,
      10
    );
  }

  // Free email with company-like suffix → “Free email domain”
  if (FREE_MAIL.test(t) && (job.company && CO_SUFFIX.test(job.company))) {
    addReason(
      reasons,
      seen,
      mkReason(
        "free-email-domain",
        "Free email domain",
        "high",
        "Company-like name but uses a free email domain."
      ),
      addPts,
      22
    );
  }

  // Suspicious URL shape
  if (job.url && SUSP_URL.test(job.url)) {
    addReason(
      reasons,
      seen,
      mkReason(
        "suspicious-url",
        "Suspicious URL",
        "medium",
        "URL looks suspicious or uses an unusual TLD."
      ),
      addPts,
      10
    );
  }

  // Remote hype
  if (REMOTE_HYPE.test(t)) {
    addReason(
      reasons,
      seen,
      mkReason("remote-only", "Remote-only hype", "low", "Emphasizes remote-only or work-from-home."),
      addPts,
      8
    );
  }

  // Nudge by declared risk
  if (job.risk === "medium") addPts(10);
  if (job.risk === "high") addPts(20);

  // Clamp
  const score = Math.max(0, Math.min(100, total));

  return { score, reasons };
}

/** Bucket mapping used by ScoreBadge colors and list tinting */
export function bucket(score: number): "low" | "medium" | "high" {
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
}