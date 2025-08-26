import type { Analysis } from "./riskRules";

export function explainFindings(a: Analysis): string {
  if (!a.flags.length) return "Looks okay. No obvious scam signals.";
  return `Flags found: ${a.flags.join(", ")}. Treat with caution and verify the company’s official site and HR contact.`;
}