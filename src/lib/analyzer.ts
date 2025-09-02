// src/lib/analyzer.ts
export type Verdict = "LOW" | "MEDIUM" | "HIGH";
export type AnalysisResult = { score: number; verdict: Verdict; flags: string[] };

// Heavier weights for the Sprint 2 acceptance list
const WEIGHTS: Record<string, number> = {
  "300-700/day": 30,
  "60-90min training": 20,
  "paid daily": 18,
  "guaranteed monthly": 18,
  "phone/whatsapp": 16,
  "fee request": 24,
  "crypto/gift cards": 28,
  "non-corp email": 14,
  "weird domain": 12,
  // extra signals
  "too-easy remote work": 8,
  "age requirement": 6,
};

// Helpers
const has = (t: string, re: RegExp) => re.test(t);

export function analyzeTextLocal(raw: string, sensitivity: number): AnalysisResult {
  const t = (raw || "").toLowerCase();

  const flags: string[] = [];

  // Core matches (heavier)
  if (/(?:\$|usd)\s?(?:3\d{2}|[4-6]\d{2}|700)\s*\/?\s*day\b/.test(t)) flags.push("300-700/day");
  if (/(60|90)\s*[-– ]?\s*min(ute)?\b.*training/.test(t)) flags.push("60-90min training");
  if (/paid\s+daily/.test(t)) flags.push("paid daily");
  if (/guaranteed\s+monthly|guarantee.*month/.test(t)) flags.push("guaranteed monthly");
  if (/(whatsapp|text\s+me|phone\s+number|\+\d{7,})/.test(t)) flags.push("phone/whatsapp");
  if (/(fee|deposit|upfront)\s+(required|pay|payment)/.test(t)) flags.push("fee request");
  if (/(crypto|bitcoin|gift\s*card|apple\s*card|steam\s*card)/.test(t)) flags.push("crypto/gift cards");
  if (/\b[\w.+-]+@(gmail|yahoo|outlook|hotmail)\.com\b/.test(t)) flags.push("non-corp email");
  if (/\b(\w+-\w+|\w{1,3})\.(top|xyz|buzz|click|work|life|live)\b/.test(t)) flags.push("weird domain");

  // extra
  if (/remote\s+job\s+(no\s+experience|simple|easy)|work\s+at\s+home\s+(simple|easy)/.test(t))
    flags.push("too-easy remote work");
  if (/\b(18|21|22)\+\b|\bage\s+(?:req|require)/.test(t)) flags.push("age requirement");

  // Sum → normalize to 0–100
  const rawSum = flags.reduce((sum, f) => sum + (WEIGHTS[f] ?? 0), 0);
  const MAX = Object.values(WEIGHTS).reduce((a, b) => a + b, 0) || 1;
  let score = Math.round((rawSum / MAX) * 100);

  // Sensitivity bump (0..1) up to +10
  const bump = Math.round((sensitivity || 0) * 10);
  score = Math.max(0, Math.min(100, score + bump));

  const verdict: Verdict = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  return { score, verdict, flags };
}