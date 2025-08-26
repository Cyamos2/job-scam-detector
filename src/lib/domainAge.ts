// Placeholder: domain age lookup can be implemented later
export async function getDomainAgeDays(_url: string): Promise<number | null> {
  return null; // unknown
}

export function getDomainAgeBonus(_url: string): number {
  // If you detect "very new" domain later, you can add a +10 bonus
  return 0;
}