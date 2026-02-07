import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import { validateInput, patternsQuerySchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

function hostFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * GET /api/v1/patterns?company=&url=&recruiterEmail=
 * Returns simple counts for repeat-pattern detection.
 */
router.get('/', asyncHandler(async (req, res) => {
  const queryResult = validateInput(patternsQuerySchema, req.query);

  if (!queryResult.success) {
    throw new OperationalError('Invalid query parameters', 400, queryResult.errors.flatten());
  }

  const { company, url, recruiterEmail } = queryResult.data;
  const host = hostFromUrl(url ?? null);

  const whereCompany = company ? { company: { contains: company } } : undefined;
  const whereEmail = recruiterEmail ? { recruiterEmail } : undefined;
  const whereHost = host ? { url: { contains: host } } : undefined;

  const [companyCount, emailCount, hostCount] = await Promise.all([
    whereCompany ? prisma.job.count({ where: whereCompany }) : Promise.resolve(0),
    whereEmail ? prisma.job.count({ where: whereEmail }) : Promise.resolve(0),
    whereHost ? prisma.job.count({ where: whereHost }) : Promise.resolve(0),
  ]);

  logger.info('Pattern check', {
    company: company ?? null,
    recruiterEmail: recruiterEmail ?? null,
    host: host ?? null,
    companyCount,
    emailCount,
    hostCount,
  });

  res.json({
    success: true,
    data: {
      companyCount,
      emailCount,
      hostCount,
      host,
    },
  });
}));

export default router;