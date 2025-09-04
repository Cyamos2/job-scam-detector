// src/lib/scoring.ts
// Tiny heuristic scorer you can replace with a real model later.

export const SCAM_KEYWORDS = [
  "gift card","crypto","bitcoin","wire transfer","zelle","telegram",
  "upfront fee","training fee","equipment fee","verification code",
  "western union","moneygram","cashapp","venmo","walmart",
  "whatsapp","urgent hire","quick money","no experience",
  "text me","commission only","daily payout","bonus daily",
  "work from home","part time evening"
].map((s) => s.toLowerCase());

/** Return integer 0..100 based on keyword hits in title/company/notes/url/source. */
export function scoreJob(job: {
  title?: string; company?: string; notes?: string; url?: string | null; source?: string;
  risk?: "low" | "medium" | "high";
}): number {
  const haystack = [
    job.title ?? "",
    job.company ?? "",
    job.notes ?? "",
    job.url ?? "",
    job.source ?? "",
  ]
    .join(" ")
    .toLowerCase();

  let hits = 0;
  for (const k of SCAM_KEYWORDS) {
    if (haystack.includes(k)) hits++;
  }

  // base score: 10 points per hit (clamped)
  let score = Math.min(100, hits * 10);

  // nudge based on declared risk (optional)
  if (job.risk === "medium") score = Math.min(100, score + 15);
  if (job.risk === "high") score = Math.min(100, score + 30);

  return score;
}

/** List which keywords matched, for “why” explanations. */
export function explainScore(job: {
  title?: string; company?: string; notes?: string; url?: string | null; source?: string;
}): string[] {
  const hay = [
    job.title ?? "",
    job.company ?? "",
    job.notes ?? "",
    job.url ?? "",
    job.source ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return SCAM_KEYWORDS.filter((k) => hay.includes(k));
}

/** Map a 0..100 score to a green→yellow→red color. */
export function colorForScore(score: number): string {
  const t = Math.max(0, Math.min(100, score)) / 100; // 0..1
  const mid = 0.5;

  let r: number, g: number, b: number;
  if (t <= mid) {
    // green(46,204,113) -> yellow(255,200,0)
    const u = t / mid;
    r = Math.round(46 + (255 - 46) * u);
    g = Math.round(204 + (200 - 204) * u);
    b = Math.round(113 + (0 - 113) * u);
  } else {
    // yellow(255,200,0) -> red(239,68,68)
    const u = (t - mid) / (1 - mid);
    r = Math.round(255 + (239 - 255) * u);
    g = Math.round(200 + (68 - 200) * u);
    b = Math.round(0 + (68 - 0) * u);
  }
  return `rgb(${r},${g},${b})`;
}