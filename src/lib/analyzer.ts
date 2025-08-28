// src/lib/analyzer.ts
export type AnalysisResult = {
  score: number;                          // 0–100
  verdict: "Low" | "Medium" | "High";
  flags: string[];
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Heuristic text analyzer for job-scam patterns.
 * Weights intentionally sum past 100; final score is clamped to 100.
 */
export function analyzeText(raw: string): AnalysisResult {
  const text = (raw || "").toLowerCase();

  const addIf = (
    re: RegExp,
    weight: number,
    flag: string,
    hits: Set<string>,
  ) => {
    if (re.test(text)) hits.add(`${flag} (+${weight})`);
    return re.test(text) ? weight : 0;
  };

  const hits = new Set<string>();
  let score = 0;

  // 💰 Unrealistic/guaranteed pay & daily pay
  score += addIf(/\b(us\$|\$)\s?(3\d{2,}|[4-9]\d{2,}|[1-9]\d{3,})\s*(per\s*)?(day|daily|hour)/i, 40, "unrealistic pay (daily/hourly)", hits);
  score += addIf(/\bmonthly\s*income\b.*(no\s*less\s*than|guaranteed|at\s*least)/, 25, "guaranteed income claim", hits);
  score += addIf(/\bpaid\s*daily\b|\bdaily\s*pay\b/, 15, "daily pay", hits);

  // 🧪 “Too easy” + short training
  score += addIf(/\b(simple|easy|can\s*be\s*completed\s*at\s*home)\b/, 12, "too-easy work", hits);
  score += addIf(/\b(60|45|30)\s*minutes?\b.*(training|onboarding)/, 12, "very short training", hits);

  // 📍 Remote + vague part-time/full-time pitch
  score += addIf(/\bremote\b/, 6, "remote pitch (generic)", hits);
  score += addIf(/\b(part[-\s]*time).*(full[-\s]*time)|\bfull[-\s]*time.*part[-\s]*time\b/, 8, "part-time/full-time bait", hits);

  // 🧒 Age gate (odd for legit US roles)
  score += addIf(/\b(2[12-9]|[3-9]\d)\s*(years? old|yo)\b|\b(22)\s*years?\s*old\b/, 10, "age requirement", hits);

  // 🗓️ Overly generous paid leave for entry/remote
  score += addIf(/\b(15|16|17|18|19|2[0-5])\s*-\s*(2[0-5])\s*days?\b.*paid\s*(annual\s*)?leave/, 8, "unusual paid leave", hits);

  // 📞 Phone/IM contact in pitch
  score += addIf(/\+\d{6,}/, 10, "phone contact in pitch", hits);
  score += addIf(/\b(whatsapp|telegram|signal)\b/, 20, "chat-app contact", hits);

  // 🪪 Company/name misrepresentation / vague recruiter hooks
  score += addIf(/\b(recruit(ing|er)?|recommend you a high[-\s]*paying)\b/, 8, "vague recruiter pitch", hits);

  // 🔗 Suspicious domains (keep from previous version)
  const urlMatch = text.match(/https?:\/\/[^\s)]+/g);
  if (urlMatch) {
    for (const url of urlMatch) {
      try {
        const u = new URL(url);
        if (/\.(top|xyz|live|shop|work|site)$/i.test(u.hostname) || /-career|careers?-?[0-9]{3,}/i.test(u.hostname)) {
          score += 10;
          hits.add("suspicious domain (+10)");
        }
      } catch {
        /* ignore */
      }
    }
  }

  // Finalize
  score = clamp(score, 0, 100);
  const verdict: AnalysisResult["verdict"] = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";

  // Convert to neat flags (drop the “(+N)” parts for UI if you prefer)
  const flags = Array.from(hits).map(f => f.replace(/\s\(\+\d+\)$/, ""));
  return { score, verdict, flags };
}