// src/lib/explain.ts
import type { Analysis, RiskMatch } from './riskRules';

/** Pull a few facts from raw text (very light heuristics) */
function extractFacts(text: string) {
  const t = text.toLowerCase();

  // role (first occurrence of common role phrases)
  const roleRx = /\b(software engineer|full[- ]stack|data entry|virtual assistant|typist|customer support|sales|account manager|project manager|product manager|designer|qa|devops|it support)\b/i;
  const role = (t.match(roleRx) || [])[0];

  // modality
  const remote = /\b(remote|work from home|wfh|wfa)\b/i.test(t);
  const onSite = /\b(on[- ]site|onsite|in[- ]office)\b/i.test(t);
  const hybrid = /\b(hybrid)\b/i.test(t);

  // pay (capture "$XX/hr", "per hour", "per day", "per year", ranges)
  const pay = (t.match(/\$ ?\d{2,3}\s*(\/|per)?\s*(hr|hour|day|year|yr|annum)/i)
            || t.match(/\$ ?\d{2,3}(?:\s*-\s*\$?\d{2,3})?\s*(\/|per)?\s*(hr|hour|day|year|yr)/i)
            || t.match(/\$ ?\d{4,6}\b/i)
           )?.[0];

  // timeline / urgency
  const urgent = /\b(start immediately|start today|urgent|instant hire|hired on the spot)\b/i.test(t);

  return { role, remote, onSite, hybrid, pay, urgent };
}

/** Summarize which categories triggered */
function explainDrivers(matches: RiskMatch[]) {
  if (!matches.length) return 'No obvious risk phrases were detected in the text you provided.';
  const buckets = new Map<string, number>();

  for (const m of matches) {
    const key =
      /fee|deposit|pay to apply/i.test(m.label) ? 'Upfront fees' :
      /gift|crypto|cashapp|venmo|zelle|paypal|moneygram|western/i.test(m.label) ? 'Unusual payment methods' :
      /telegram|whatsapp|signal|messenger|chat/i.test(m.label) ? 'Chat-only interview' :
      /check|equipment|buy|purchase/i.test(m.label) ? 'Fake check / equipment scheme' :
      /ssn|routing|account|id|license|passport/i.test(m.label) ? 'Sensitive data request' :
      /gmail|yahoo|hotmail|outlook/i.test(m.label) ? 'Free email domain' :
      /immediate|urgent|no interview/i.test(m.label) ? 'Urgency / no interview' :
      /pay|data entry|typist|assistant/i.test(m.label) ? 'Too-good-to-be-true pay' :
      'Other';
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const parts = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  if (!parts.length) return 'No obvious risk drivers identified.';
  if (parts.length === 1) return `Primary risk driver: ${parts[0]}.`;
  if (parts.length === 2) return `Primary risk drivers: ${parts[0]} and ${parts[1]}.`;
  return `Primary risk drivers: ${parts.slice(0, 3).join(', ')}.`;
}

/** Turn analysis + facts into a short narrative */
export function buildExplanation(rawText: string, analysis: Analysis) {
  const { score, level, matches } = analysis;
  const facts = extractFacts(rawText);

  // Summary line
  const role = facts.role ? facts.role : 'role not clearly specified';
  const modality = facts.hybrid ? 'hybrid' : facts.remote ? 'remote' : facts.onSite ? 'on-site' : 'modality not specified';
  const pay = facts.pay ? `Pay mention: ${facts.pay}.` : 'No explicit pay figure was found.';
  const urgency = facts.urgent ? 'There is language indicating urgency or immediate start.' : '';

  const summary = `This appears to be a ${modality} ${role}. ${pay} ${urgency}`.trim();

  // Why (drivers)
  const why = explainDrivers(matches);

  // Evidence list (top 3 matches with snippets)
  const top = matches.slice(0, 3).map(m => `• ${m.label}: “${m.hit}”`);

  // Next steps (recommendations based on level)
  const next =
    level === 'High'
      ? [
          'Do not send money or personal documents.',
          'Verify the company’s official domain and email (avoid free email providers).',
          'Search the company on LinkedIn and cross-check employees.',
        ]
      : level === 'Medium'
      ? [
          'Verify the company domain and email formatting.',
          'Ask for a video interview and official offer letter.',
          'Be cautious with any request for fees or equipment purchases.',
        ]
      : [
          'Confirm interview process and official email domain.',
          'Avoid sharing sensitive information until an offer is verified.',
        ];

  return { summary, why, topEvidence: top, recommendations: next };
}