import type { Settings } from "../appSettings";

export type Analysis = {
  score: number;           // 0..100
  level: "Low" | "Medium" | "High";
  flags: string[];
};

const FLAG_PHRASES = [
  "wire transfer", "gift card", "pay to apply", "training fee",
  "crypto", "telegram", "whatsapp", "send your ssn",
  "bank login", "check deposit"
];

export function analyzeJobText(text: string, settings: Settings): Analysis {
  const t = (text || "").toLowerCase();

  let score = 0;
  const flags: string[] = [];

  for (const phrase of FLAG_PHRASES) {
    if (t.includes(phrase)) {
      flags.push(phrase);
      score += 15;
    }
  }

  if (t.includes("no experience required")) score += 8;
  if (t.includes("quick money")) score += 12;
  if (t.includes("remote") && t.includes("immediately")) score += 5;

  // Adjust by sensitivity
  const mult = settings.sensitivity === "High" ? 1.25 : settings.sensitivity === "Low" ? 0.85 : 1;
  score = Math.min(100, Math.max(0, Math.round(score * mult)));

  const level: Analysis["level"] = score < 33 ? "Low" : score < 66 ? "Medium" : "High";
  return { score, level, flags };
}