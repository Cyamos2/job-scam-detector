import { Router } from 'express';
import fetch from 'node-fetch';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import { validateInput, verifyQuerySchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

const SUSPICIOUS_TLDS = new Set([
  'zip', 'mov', 'xyz', 'top', 'click', 'link', 'gq', 'tk', 'ml', 'cf', 'ga', 'icu', 'work', 'monster',
]);

function normalizeCompanyToken(input?: string | null): string | null {
  const raw = (input ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return raw.length >= 4 ? raw : null;
}

function parseUrl(url?: string | null): { site: string | null; host: string | null; https: boolean | null; tld: string | null } {
  if (!url) return { site: null, host: null, https: null, tld: null };
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const parts = host.split('.');
    const tld = parts.length > 1 ? parts[parts.length - 1] : null;
    return { site: `${u.protocol}//${u.hostname}`, host, https: u.protocol === 'https:', tld };
  } catch {
    return { site: null, host: null, https: null, tld: null };
  }
}

async function fetchDomainAge(host?: string | null): Promise<{ createdAt: string | null; ageDays: number | null; provider: 'rdap' | 'fallback' }>{
  if (!host) return { createdAt: null, ageDays: null, provider: 'fallback' };
  try {
    const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(host)}`;
    const resp = await fetch(rdapUrl, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!resp.ok) return { createdAt: null, ageDays: null, provider: 'fallback' };
    const json = (await resp.json()) as Record<string, any>;
    let createdAt: string | null = null;
    if (Array.isArray(json.events)) {
      for (const ev of json.events as Array<{ eventAction?: string; eventDate?: string }>) {
        const action = String(ev.eventAction ?? '').toLowerCase();
        if ((/create|registration|registration-date|registered/).test(action) && ev.eventDate) {
          createdAt = ev.eventDate;
          break;
        }
      }
    }
    if (!createdAt && json.created) createdAt = String(json.created);
    let ageDays: number | null = null;
    if (createdAt) {
      const createdDate = new Date(createdAt);
      if (!isNaN(createdDate.getTime())) {
        ageDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    return { createdAt: createdAt ?? null, ageDays, provider: 'rdap' };
  } catch {
    return { createdAt: null, ageDays: null, provider: 'fallback' };
  }
}

/**
 * GET /api/v1/verify?company=<name>&url=<url>
 * Back-compat: /api/v1/verify?target=<url or company>
 */
router.get('/', asyncHandler(async (req, res) => {
  const queryResult = validateInput(verifyQuerySchema, req.query);

  if (!queryResult.success) {
    throw new OperationalError('Invalid query parameters', 400, queryResult.errors.flatten());
  }

  let { company, url, target } = queryResult.data as { company?: string; url?: string; target?: string };
  if (target && !company && !url) {
    if (/^https?:\/\//i.test(target)) url = target;
    else company = target;
  }

  const companyToken = normalizeCompanyToken(company ?? null);
  const parsed = parseUrl(url ?? null);
  const tldSuspicious = parsed.tld ? SUSPICIOUS_TLDS.has(parsed.tld) : null;
  const domain = await fetchDomainAge(parsed.host);

  let linkedIn = { found: false, companyUrl: null as string | null, employeesHint: null as number | null };
  if (url && /linkedin\.com\/company\//i.test(url)) {
    linkedIn = { found: true, companyUrl: url, employeesHint: null };
  } else if (company) {
    linkedIn = {
      found: false,
      companyUrl: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company)}`,
      employeesHint: null,
    };
  }

  let ok = true;
  if (parsed.https === false) ok = false;
  if (tldSuspicious) ok = false;
  if (companyToken && parsed.host && !parsed.host.replace(/^www\./, '').includes(companyToken)) ok = false;

  logger.info('Verification performed', {
    company: company ?? null,
    url: url ?? null,
    ok,
    tld: parsed.tld ?? null,
    https: parsed.https ?? null,
  });

  res.json({
    ok,
    company: company ?? null,
    site: parsed.site,
    https: parsed.https,
    tld: parsed.tld,
    tldSuspicious,
    linkedIn,
    domain,
  });
}));

export default router;
