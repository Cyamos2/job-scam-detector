/**
 * Scam Knowledge Database
 * 
 * Data sourced from legitimate authorities:
 * - FTC (Federal Trade Commission) - ftc.gov
 * - FBI IC3 (Internet Crime Complaint Center) - ic3.gov
 * - O*NET (Occupational Information Network) - onetonline.org
 * - US Department of Labor - dol.gov
 * - Better Business Bureau - bbb.org
 * 
 * Last updated: 2024
 */

// Job categories commonly used in scams
export const SCAM_JOB_CATEGORIES: Record<string, ScamCategory> = {
  "data entry": {
    name: "Data Entry",
    riskLevel: "high",
    description: "Commonly used in scam job postings. Legitimate data entry jobs typically pay $12-20/hr.",
    ftcWarnings: [
      "Legitimate data entry jobs rarely offer high pay for minimal work",
      "Be wary of jobs requiring upfront fees for training or equipment",
      "No legitimate company will send you a check to purchase equipment"
    ],
    commonRedFlags: [
      "Guaranteed income",
      "Work from home with no experience needed",
      "Upfront payment required",
      "Check in advance for equipment"
    ],
    legitimateSources: {
      dol: { wageType: "median", range: { min: 12, max: 22, per: "hour" } },
      onet: { code: "43-9021", title: "Data Entry Keyers" }
    }
  },
  "customer service": {
    name: "Customer Service",
    riskLevel: "medium",
    description: "Legitimate remote customer service jobs exist but verify the company carefully.",
    ftcWarnings: [
      "Verify company through official channels",
      "Legitimate employers don't ask for personal info in initial contact"
    ],
    commonRedFlags: [
      "Text-based interviews only",
      "Move to personal email immediately",
      "Requests personal banking info early"
    ],
    legitimateSources: {
      dol: { wageType: "median", range: { min: 14, max: 24, per: "hour" } },
      onet: { code: "43-4051", title: "Customer Service Representatives" }
    }
  },
  "personal assistant": {
    name: "Personal Assistant",
    riskLevel: "medium",
    description: "Often used in resale fraud schemes. Verify employer identity thoroughly.",
    ftcWarnings: [
      "Watch for reshipping/mule scams",
      "Never agree to repackage and forward packages"
    ],
    commonRedFlags: [
      "Package handling from home",
      "Repacking luxury items",
      "Receiving and reshipping"
    ],
    legitimateSources: {
      dol: { wageType: "median", range: { min: 15, max: 28, per: "hour" } },
      onet: { code: "43-6011", title: "Executive Secretaries and Administrative Assistants" }
    }
  },
  "repack": {
    name: "Repacking/Reshipping",
    riskLevel: "critical",
    description: "This is almost always a scam. You could face criminal liability.",
    ftcWarnings: [
      "Reshipping stolen or fraudulent merchandise is illegal",
      "You're acting as an unwitting accomplice to fraud",
      "You can face federal charges"
    ],
    commonRedFlags: [
      "Repackaging luxury goods",
      "Relabeling packages",
      "Shipping to overseas addresses"
    ],
    legitimateSources: {
      ftcAlert: "https://www.ftc.gov/news-events/press-releases/2021/11/ftc-warns-consumers-about-reshipping-scams"
    }
  },
  "remote": {
    name: "Remote Work",
    riskLevel: "medium",
    description: "Remote work is legitimate but scammers heavily target this category.",
    ftcWarnings: [
      "Research the company thoroughly",
      "Never pay for job opportunities",
      "Legitimate remote jobs go through proper hiring processes"
    ],
    commonRedFlags: [
      "Immediate hiring without interview",
      "Guaranteed weekly pay",
      "Company email is Gmail/Outlook"
    ],
    legitimateSources: {}
  },
  "warehouse": {
    name: "Warehouse/Stock",
    riskLevel: "high",
    description: "Cannot be done remotely. Job requires physical presence.",
    ftcWarnings: [
      "Warehouse jobs require physical presence",
      "Remote warehouse jobs are always scams"
    ],
    commonRedFlags: [
      "Work from home for warehouse role",
      "Equipment shipping for warehouse job",
      "Remote stock/fulfillment positions"
    ],
    legitimateSources: {
      dol: { wageType: "median", range: { min: 14, max: 20, per: "hour" } },
      onet: { code: "53-7062", title: "Laborers and Freight, Stock, and Material Movers" }
    }
  },
  "driver": {
    name: "Delivery/Driver",
    riskLevel: "medium",
    description: "Legitimate delivery jobs exist but verify company carefully.",
    ftcWarnings: [
      "Ride-share companies don't hire through job postings",
      "Delivery apps hire directly through their platforms"
    ],
    commonRedFlags: [
      "Company sends check for vehicle",
      "Need to pay for delivery supplies",
      "Hire without meeting in person"
    ],
    legitimateSources: {
      dol: { wageType: "median", range: { min: 15, max: 25, per: "hour" } },
      onet: { code: "53-3033", title: "Truck Drivers" }
    }
  },
  "medical": {
    name: "Medical/Healthcare",
    riskLevel: "high",
    description: "Healthcare job scams can lead to identity theft. Verify credentials.",
    ftcWarnings: [
      "Legitimate healthcare employers verify licenses",
      "Never provide SSN before interview",
      "Check employer against state licensing boards"
    ],
    commonRedFlags: [
      "No license verification needed",
      "Immediate start without background check",
      "Requesting SSN/W-4 before offer"
    ],
    legitimateSources: {
      dol: { wageType: "median", range: { min: 18, max: 35, per: "hour" } },
      onet: { category: "Healthcare Support" }
    }
  },
  "package": {
    name: "Package Handler",
    riskLevel: "critical",
    description: "This is almost always a reshipping scam. Do not participate.",
    ftcWarnings: [
      "Package handler jobs from home are scams",
      "You're being used to transport stolen/fraudulent goods",
      "Report these to local authorities and IC3"
    ],
    commonRedFlags: [
      "Work from home",
      "Receive and forward packages",
      "No interview required"
    ],
    legitimateSources: {
      dol: { wageType: "median", range: { min: 13, max: 18, per: "hour" } }
    }
  },
  "model": {
    name: "Model/Actor",
    riskLevel: "high",
    description: "Modeling and acting scams are common. Verify agencies through BBB.",
    ftcWarnings: [
      "Legitimate agencies don't charge upfront fees",
      "Check agencies against talent union directories",
      "Never pay for portfolio photos upfront"
    ],
    commonRedFlags: [
      "Upfront fees for registration",
      "Pay for training",
      "Guaranteed contracts"
    ],
    legitimateSources: {
      dol: { wageType: "median", range: { min: 15, max: 50, per: "hour" } },
      bbb: { note: "Check with local BBB for talent agency reviews" }
    }
  }
};

// Common scam patterns by keyword
export const SCAM_PATTERNS: Record<string, ScamPattern> = {
  "upfront-fee": {
    keyword: "upfront-fee",
    severity: "critical",
    title: "Upfront Fee Request",
    description: "Legitimate employers never require payment before starting work.",
    sources: [
      { name: "FTC", url: "https://www.ftc.gov" },
      { name: "BBB", url: "https://www.bbb.org" }
    ],
    advice: "End communication immediately. This is a scam."
  },
  "check-scam": {
    keyword: "check-scam",
    severity: "critical",
    title: "Fake Check Scam",
    description: "You'll be asked to deposit a check and return money. The check eventually bounces.",
    sources: [
      { name: "FTC", url: "https://www.consumer.ftc.gov/articles/fake-checks" },
      { name: "FBI IC3", url: "https://www.ic3.gov" }
    ],
    advice: "Never deposit checks from unknown employers. Wait for funds to clear."
  },
  "reshipping": {
    keyword: "reshipping",
    severity: "critical",
    title: "Reshipping/Parcel Mule",
    description: "You'll receive and repackage packages, often stolen or fraudulent.",
    sources: [
      { name: "FTC", url: "https://www.ftc.gov/news-events/press-releases/2021/11/ftc-warns-consumers-about-reshipping-scams" }
    ],
    advice: "This is illegal. You're participating in fraud. Stop immediately."
  },
  "young-domain": {
    keyword: "young-domain",
    severity: "high",
    title: "Newly Registered Domain",
    description: "Company website was registered recently, often within days or weeks.",
    sources: [
      { name: "WHOIS", url: "https://whois.domaintools.com" }
    ],
    advice: "Verify company through other sources. Search for reviews and complaints."
  },
  "free-email": {
    keyword: "free-email",
    severity: "medium",
    title: "Free Email Domain",
    description: "Company uses Gmail, Yahoo, or other free email for official communication.",
    sources: [],
    advice: "Legitimate companies use custom domain emails. Be cautious."
  },
  "impossible-remote": {
    keyword: "impossible-remote",
    severity: "high",
    title: "Impossible Remote Claim",
    description: "Role requires physical presence but claims to be remote.",
    sources: [
      { name: "O*NET", url: "https://www.onetonline.org" }
    ],
    advice: "This role cannot be done remotely. It's a scam."
  }
};

// IC3 statistics by year (mock data based on actual trends)
export const IC3_STATS: Record<string, { year: number; reports: number; losses: number }> = {
  "2023": { year: 2023, reports: 80000, losses: 350000000 },
  "2022": { year: 2022, reports: 75000, losses: 310000000 },
  "2021": { year: 2021, reports: 70000, losses: 280000000 },
  "2020": { year: 2020, reports: 65000, losses: 250000000 }
};

// BBB scam categories
export const BBB_SCAM_CATEGORIES = [
  "Employment scams",
  "Advance fee loans",
  "Fake checks",
  "Identity theft",
  "Online purchase scams"
];

// Types
export interface ScamCategory {
  name: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  description: string;
  ftcWarnings: string[];
  commonRedFlags: string[];
  legitimateSources: {
    dol?: { wageType?: string; range: { min: number; max: number; per: string }; onet?: { code?: string; title?: string } | { category: string } };
    onet?: { code?: string; title?: string } | { category: string };
    ftcAlert?: string;
    bbb?: { note: string };
  };
}

export interface ScamPattern {
  keyword: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  sources: { name: string; url: string }[];
  advice: string;
}

// Helper functions
export function getCategoryForKeyword(keyword: string): ScamCategory | null {
  const lower = keyword.toLowerCase();
  for (const [key, value] of Object.entries(SCAM_JOB_CATEGORIES)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  return null;
}

export function getPatternByKeyword(keyword: string): ScamPattern | null {
  return SCAM_PATTERNS[keyword] || null;
}

export function getLegitimateSalary(role: string): { min: number; max: number; per: string; source: string } | null {
  const category = getCategoryForKeyword(role);
  if (category?.legitimateSources?.dol?.range) {
    return {
      min: category.legitimateSources.dol.range.min,
      max: category.legitimateSources.dol.range.max,
      per: category.legitimateSources.dol.range.per,
      source: "U.S. Department of Labor (BLS)"
    };
  }
  return null;
}

