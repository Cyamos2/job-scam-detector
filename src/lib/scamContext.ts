/**
 * Scam Context Service
 * 
 * Fetches contextual information about potential scams from legitimate sources:
 * - FTC warnings
 * - IC3 statistics  
 * - DOL salary data
 * - Job-specific scam patterns
 */

import api from "./db";

// Types for scam context responses
export interface ScamCategory {
  name: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  description: string;
  ftcWarnings: string[];
  commonRedFlags: string[];
  sources: { name: string; url: string }[];
}

export interface ScamPattern {
  keyword: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  sources: { name: string; url: string }[];
  advice: string;
}

export interface IC3Stats {
  year: number;
  totalReports: number;
  totalLosses: number;
  averageLoss: number;
  source: string;
  sourceUrl: string;
}

export interface SalaryInfo {
  range: string;
  min: number;
  max: number;
  per: string;
  source: string;
  sourceUrl: string;
}

export interface FTCResource {
  name: string;
  url: string;
}

export interface ScamContextResponse {
  found: boolean;
  category?: ScamCategory;
  pattern?: ScamPattern;
  stats?: IC3Stats | IC3Stats[];
  salary?: SalaryInfo;
  generalAdvice?: string[];
  ftcResources?: FTCResource[];
  jobCategory?: ScamCategory | null;
  ic3Stats?: { latest: IC3Stats; source: string; sourceUrl: string };
}

/**
 * Get scam context for a job type
 */
export async function getJobContext(jobTitle: string): Promise<ScamContextResponse | null> {
  try {
    const response = await api.scamContext("job", jobTitle);
    return response.data as ScamContextResponse;
  } catch (error) {
    console.warn("Failed to get job context:", error);
    return null;
  }
}

/**
 * Get detailed info about a scam pattern
 */
export async function getPatternContext(pattern: string): Promise<ScamContextResponse | null> {
  try {
    const response = await api.scamContext("pattern", pattern);
    return response.data as ScamContextResponse;
  } catch (error) {
    console.warn("Failed to get pattern context:", error);
    return null;
  }
}

/**
 * Get IC3 statistics (FBI Internet Crime Report)
 */
export async function getIC3Stats(year?: string): Promise<IC3Stats | IC3Stats[] | null> {
  try {
    const response = await api.scamContext("stats", undefined, year);
    const data = response.data as ScamContextResponse;
    return data.stats ?? null;
  } catch (error) {
    console.warn("Failed to get IC3 stats:", error);
    return null;
  }
}

/**
 * Get legitimate salary range for a job type
 */
export async function getSalaryRange(jobTitle: string): Promise<SalaryInfo | null> {
  try {
    const response = await api.scamContext("salary", jobTitle);
    const data = response.data as ScamContextResponse;
    return data.salary ?? null;
  } catch (error) {
    console.warn("Failed to get salary range:", error);
    return null;
  }
}

/**
 * Get all scam context for a job (combines multiple sources)
 */
export async function getFullContext(jobTitle: string): Promise<ScamContextResponse | null> {
  try {
    const response = await api.scamContext("all", jobTitle);
    return response.data as ScamContextResponse;
  } catch (error) {
    console.warn("Failed to get full context:", error);
    return null;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount}`;
}

/**
 * Get risk level color
 */
export function getRiskColor(level: string): string {
  switch (level) {
    case "critical":
      return "#DC2626";
    case "high":
      return "#EF4444";
    case "medium":
      return "#F59E0B";
    case "low":
      return "#10B981";
    default:
      return "#6B7280";
  }
}

/**
 * Get risk level background color
 */
export function getRiskBgColor(level: string): string {
  switch (level) {
    case "critical":
      return "#FEE2E2";
    case "high":
      return "#FEE2E2";
    case "medium":
      return "#FEF3C7";
    case "low":
      return "#D1FAE5";
    default:
      return "#F3F4F6";
  }
}

