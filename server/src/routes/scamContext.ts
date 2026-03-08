import { Router } from 'express';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import {
  SCAM_JOB_CATEGORIES,
  SCAM_PATTERNS,
  IC3_STATS,
  getCategoryForKeyword,
  getPatternByKeyword,
  getLegitimateSalary,
  type ScamCategory
} from '../data/scamKnowledge.js';

const router = Router();

/**
 * GET /api/v1/scam-context
 * 
 * Query parameters:
 * - type: 'job' | 'pattern' | 'stats' | 'salary'
 * - value: string (job title, pattern keyword, or year for stats)
 * 
 * Returns contextual information about potential scams from legitimate sources:
 * - FTC warnings
 * - IC3 statistics
 * - O*NET job characteristics
 * - DOL salary data
 */
router.get('/', asyncHandler(async (req, res) => {
  const { type, value, year } = req.query;

  if (!type || typeof type !== 'string') {
    throw new OperationalError('Missing required parameter: type', 400);
  }

  const typeLower = type.toLowerCase();
  let responseData: Record<string, unknown> = {};

  switch (typeLower) {
    case 'job': {
      // Get scam context for a job type
      const jobValue = typeof value === 'string' ? value : '';
      const category = getCategoryForKeyword(jobValue);
      
      if (category) {
        responseData = {
          found: true,
          category: {
            name: category.name,
            riskLevel: category.riskLevel,
            description: category.description,
            ftcWarnings: category.ftcWarnings,
            commonRedFlags: category.commonRedFlags,
            sources: buildSources(category)
          }
        };
      } else {
        // Generic job advice
        responseData = {
          found: false,
          generalAdvice: getGeneralJobAdvice(),
          ftcResources: getFTCResources()
        };
      }
      break;
    }

    case 'pattern': {
      // Get detailed info about a specific scam pattern
      const patternValue = typeof value === 'string' ? value : '';
      const pattern = getPatternByKeyword(patternValue);
      
      if (pattern) {
        responseData = {
          found: true,
          pattern: {
            keyword: pattern.keyword,
            severity: pattern.severity,
            title: pattern.title,
            description: pattern.description,
            sources: pattern.sources,
            advice: pattern.advice
          }
        };
      } else {
        responseData = {
          found: false,
          message: 'Pattern not found in knowledge base'
        };
      }
      break;
    }

    case 'stats': {
      // Get IC3 statistics
      const yearValue = typeof year === 'string' ? year : '2023';
      const stats = IC3_STATS[yearValue];
      
      if (stats) {
        responseData = {
          found: true,
          stats: {
            year: stats.year,
            totalReports: stats.reports,
            totalLosses: stats.losses,
            averageLoss: Math.round(stats.losses / stats.reports),
            source: 'FBI Internet Crime Complaint Center (IC3)',
            sourceUrl: 'https://www.ic3.gov'
          }
        };
      } else {
        // Return all available years
        responseData = {
          found: true,
          stats: Object.values(IC3_STATS).map(s => ({
            year: s.year,
            totalReports: s.reports,
            totalLosses: s.losses,
            averageLoss: Math.round(s.losses / s.reports)
          })),
          source: 'FBI Internet Crime Complaint Center (IC3)',
          sourceUrl: 'https://www.ic3.gov'
        };
      }
      break;
    }

    case 'salary': {
      // Get legitimate salary range for a job type
      const salaryValue = typeof value === 'string' ? value : '';
      const salary = getLegitimateSalary(salaryValue);
      
      if (salary) {
        responseData = {
          found: true,
          salary: {
            range: `$${salary.min}-$${salary.max} per ${salary.per}`,
            min: salary.min,
            max: salary.max,
            per: salary.per,
            source: salary.source,
            sourceUrl: 'https://www.bls.gov'
          }
        };
      } else {
        responseData = {
          found: false,
          message: 'Salary data not available for this job type'
        };
      }
      break;
    }

    case 'all': {
      // Return all scam knowledge
      const jobValue = typeof value === 'string' ? value : '';
      const category = getCategoryForKeyword(jobValue);
      
      responseData = {
        jobCategory: category ? {
          name: category.name,
          riskLevel: category.riskLevel,
          description: category.description,
          ftcWarnings: category.ftcWarnings,
          sources: buildSources(category)
        } : null,
        generalAdvice: getGeneralJobAdvice(),
        ftcResources: getFTCResources(),
        ic3Stats: {
          latest: IC3_STATS['2023'],
          source: 'FBI IC3',
          sourceUrl: 'https://www.ic3.gov'
        }
      };
      break;
    }

    default:
      throw new OperationalError(`Invalid type: ${type}. Valid types: job, pattern, stats, salary, all`, 400);
  }

  logger.info('Scam context fetched', {
    type: typeLower,
    value: value ?? null,
    found: responseData.found ?? true
  });

  res.json({
    success: true,
    data: responseData
  });
}));

/**
 * GET /api/v1/scam-context/categories
 * 
 * Returns all available job categories
 */
router.get('/categories', asyncHandler(async (_req, res) => {
  const categories = Object.entries(SCAM_JOB_CATEGORIES).map(([key, cat]) => ({
    keyword: key,
    name: cat.name,
    riskLevel: cat.riskLevel,
    description: cat.description
  }));

  res.json({
    success: true,
    data: { categories }
  });
}));

/**
 * GET /api/v1/scam-context/patterns
 * 
 * Returns all scam patterns
 */
router.get('/patterns', asyncHandler(async (_req, res) => {
  const patterns = Object.values(SCAM_PATTERNS).map(pattern => ({
    keyword: pattern.keyword,
    severity: pattern.severity,
    title: pattern.title,
    description: pattern.description
  }));

  res.json({
    success: true,
    data: { patterns }
  });
}));

// Helper functions
function buildSources(category: ScamCategory): { name: string; url: string }[] {
  const sources: { name: string; url: string }[] = [];
  
  if (category.legitimateSources?.dol) {
    sources.push({
      name: 'U.S. Department of Labor',
      url: 'https://www.bls.gov'
    });
  }
  
  if (category.legitimateSources?.onet) {
    sources.push({
      name: 'O*NET Online',
      url: 'https://www.onetonline.org'
    });
  }
  
  if (category.legitimateSources?.ftcAlert) {
    sources.push({
      name: 'FTC',
      url: category.legitimateSources.ftcAlert
    });
  }
  
  if (category.legitimateSources?.bbb) {
    sources.push({
      name: 'Better Business Bureau',
      url: 'https://www.bbb.org'
    });
  }
  
  // Always add FTC general resource
  sources.push({
    name: 'FTC Consumer Information',
    url: 'https://www.consumer.ftc.gov'
  });
  
  sources.push({
    name: 'FBI IC3',
    url: 'https://www.ic3.gov'
  });
  
  return sources;
}

function getGeneralJobAdvice(): string[] {
  return [
    "Never pay for a job - legitimate employers don't charge for hiring",
    "Research the company independently before sharing personal information",
    "Be wary of jobs that promise high pay for minimal work",
    "Verify job postings on the company's official website",
    "Never accept checks to purchase equipment",
    "Don't provide SSN or financial info until you've verified the employer",
    "Be cautious of jobs that require immediate decisions",
    "Check with BBB and state attorney general for complaints"
  ];
}

function getFTCResources(): { name: string; url: string }[] {
  return [
    { name: 'Fake Checks', url: 'https://www.consumer.ftc.gov/articles/fake-checks' },
    { name: 'Job Scams', url: 'https://www.consumer.ftc.gov/articles/job-scams' },
    { name: 'Work-From-Home Scams', url: 'https://www.consumer.ftc.gov/articles/working-home-stay-home' },
    { name: 'Reshipping Scams', url: 'https://www.ftc.gov/news-events/press-releases/2021/11/ftc-warns-consumers-about-reshipping-scams' },
    { name: 'Report Fraud', url: 'https://reportfraud.ftc.gov' }
  ];
}

export default router;

