// src/lib/analyzer.ts
export type AnalysisResult = {
  score: number; // 0..100
  verdict: "Low" | "Medium" | "High";
  flags: string[];
};

/**
 * Heuristic analyzer (local, no network).
 * - Looks for well-known scam patterns
 * - Sums weighted signals -> 0..100
 * - Applies "sensitivity" (0=very lenient, 100=very strict) to verdict thresholds
 */
export function analyzeTextLocal(raw: string, sensitivity = 50): AnalysisResult {
  const text = (raw || "").toLowerCase();

  // ---------- weighted patterns ----------
  const rules: Array<{ re: RegExp; weight: number; label: string }> = [
    // contact over chat apps
    { re: /\b(whats\s*app|whatsapp|telegram|signal)\b/, weight: 22, label: "chat-app contact" },

    // gift cards / crypto / wires
    { re: /\bgift\s*card(s)?\b|\b(apple|steam|google)\s*card(s)?\b/, weight: 34, label: "gift card payment" },
    { re: /\b(crypto|bitcoin|btc|usdt|binance)\b/, weight: 22, label: "crypto payment" },
    { re: /\b(wire\s*transfer|western\s*union|money\s*gram|moneygram)\b/, weight: 18, label: "wire transfer" },

    // unrealistic pay and guarantees
    { re: /\b(?:us?\$|\$)\s?\d{3,}\s*(?:per|\/)\s*(?:day|hour)\b/, weight: 30, label: "high daily/hourly pay" },
    { re: /\b(?:us?\$|\$)\s?10[,.]?0{3,}\b.*\b(month|monthly)\b/, weight: 26, label: "guaranteed monthly income" },
    { re: /\bpaid\s+daily\b|\bdaily\s+payout\b/, weight: 22, label: "paid daily" },

    // short “training” or “onboarding”
    { re: /\b(60|90)\s*(minutes|min)\b.*\b(training|onboarding)\b/, weight: 18, label: "60–90 min training" },

    // phone contact exposed (very broad but indicative for spammy blasts)
    { re: /\+?\d[\d\s\-().]{9,}/, weight: 16, label: "direct phone contact" },

    // easy work, work from home promise
    { re: /\b(work\s*from\s*home|remote)\b.*\b(simple|easy|no\s+experience)\b/, weight: 12, label: "too-easy remote work" },

    // age gate that looks like mass-recruitment
    { re: /\b(2[12]|23|24|25)\s*(years?\s*old|\+)\b/, weight: 10, label: "age requirement 22+" },

    // non-corporate mailbox or interview via chat
    { re: /\b(interview|chat)\b.*\b(whatsapp|telegram|sms|text)\b/, weight: 18, label: "chat interview" },
    { re: /\b@(gmail|yahoo|outlook|hotmail)\.com\b/, weight: 10, label: "non-corporate email" },
  ];

  // suspicious domains in links
  const urlMatches = raw.match(/https?:\/\/[^\s)]+/gi) || [];
  const suspiciousDomain = (host: string) =>
    /\.(top|xyz|live|shop|work|site|click|link|info)$/i.test(host) ||
    /-career|careers?-?\d{3,}/i.test(host);

  // ---------- scoring ----------
  let score = 0;
  const flags: string[] = [];

  for (const r of rules) {
    if (r.re.test(text)) {
      score += r.weight;
      flags.push(r.label);
    }
  }

  for (const url of urlMatches) {
    try {
      const u = new URL(url);
      if (suspiciousDomain(u.hostname)) {
        score += 12;
        flags.push("suspicious domain");
      }
    } catch {
      /* ignore bad URLs */
    }
  }

  // Cap and de-dupe
  score = clamp(score, 0, 100);
  const uniqueFlags = Array.from(new Set(flags));

  // ---------- verdict with sensitivity ----------
  // Base thresholds: Medium >= 30, High >= 60
  // Sensitivity (0..100) shifts these: higher sensitivity lowers thresholds (more strict)
  const s = clamp(sensitivity, 0, 100);
  const sensUnit = (s - 50) / 50; // -1..+1
  const hiBase = 60, medBase = 30;
  const highThr = clamp(Math.round(hiBase - 15 * sensUnit), 35, 80); // 45 at s=100, 75 at s=0
  const medThr  = clamp(Math.round(medBase - 10 * sensUnit), 15, 45); // 20 at s=100, 40 at s=0

  const verdict: AnalysisResult["verdict"] =
    score >= highThr ? "High" : score >= medThr ? "Medium" : "Low";

  return { score, verdict, flags: uniqueFlags };
}

/* utils */
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}