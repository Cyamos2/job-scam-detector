// src/lib/analyzer.ts

export type AnalysisResult = {
  score: number;
  verdict: "Low" | "Medium" | "High";
  flags: string[];
};

/** Heavier-weight scam analyzer v2 */
export function analyzeTextLocal(raw: string, sensitivity: number = 50): AnalysisResult {
  const text = (raw || "").toLowerCase();

  const has = (re: RegExp) => re.test(text);

  // Core red-flag patterns with weights
  const patterns: Array<[RegExp, number, string]> = [
    // Contact methods
    [/\b(whats\s*app|telegram|signal)\b/, 25, "chat-app contact"],
    [/\b(text|message|sms)\s+(me|us)\b/, 15, "text/SMS contact"],
    [/\+?\d[\d\s().-]{7,}\d/, 15, "phone number"],

    // Payment methods
    [/\bgift\s*card|apple\s*card|steam\s*card|voucher\b/, 40, "gift card payment"],
    [/\bcrypto|bitcoin|usdt|binance|wallet address\b/, 30, "crypto payment"],

    // Payout cadence
    [/\bpaid\s+daily|daily\s+payout|pay\s+daily\b/, 20, "daily payout"],
    [/\bguaranteed\b.*\b(month(ly)?|income)\b/, 25, "guaranteed income"],

    // Compensation
    [/\$\s?\d{3,4}\s*(per|\/)?\s*(day|daily|90\s*minutes)/, 30, "very high day-rate"],
    [/\bearn\b.*\$\s?\d{3,}|\$\s?\d{4,}\b/, 20, "unrealistic pay"],

    // Training / workload
    [/\b(60|90)\s*minutes?\b.*\btraining\b/, 20, "short training"],
    [/\bno|little\b.*\bexperience\b|\bwork\s*from\s*home\b.*\b(simple|easy)\b/, 15, "too-easy workload"],

    // Shady hiring
    [/\binterview\b.*(whatsapp|telegram|sms|chat)/, 20, "chat-app interview"],
    [/\bverify\b.*(code|otp).*(sms|whatsapp)/, 15, "OTP via chat"],
    [/\bpart[-\s]?time\b.*\bfull[-\s]?time\b.*\bchoose\b/, 8, "choose part/full-time"],
    [/\b(18|21|22)\s*(\+|plus)?\s*(years?\s*old)?\b/, 6, "age requirement"],

    // Email / domains
    [/\b(gmail|outlook|yahoo)\.com\b.*(hr|recruit)?/, 10, "non-corp email"],
  ];

  let score = 0;
  const flags: string[] = [];

  for (const [re, pts, label] of patterns) {
    if (has(re)) {
      score += pts;
      flags.push(label);
    }
  }

  // Check URLs for sketchy domains
  const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
  for (const url of urls) {
    try {
      const u = new URL(url);
      if (
        /\.(top|xyz|live|shop|work|site|click|buzz|win)$/i.test(u.hostname) ||
        /-career|\bcareers?\b-?\d{3,}/i.test(u.hostname)
      ) {
        score += 12;
        flags.push("suspicious domain");
      }
    } catch {
      /* ignore parse errors */
    }
  }

  // Sensitivity adjustment: 0–100 → shift score -25..+25
  const sensShift = Math.round((sensitivity - 50) / 2);
  score = Math.max(0, Math.min(100, score + sensShift));

  // Verdict thresholds
  const verdict: AnalysisResult["verdict"] =
    score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";

  return { score, verdict, flags: Array.from(new Set(flags)) };
}