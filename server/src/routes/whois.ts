import { Router } from 'express';
import fetch from 'node-fetch';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import { validateInput, whoisQuerySchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/v1/whois?domain=example.com
 * Get WHOIS information for a domain
 */
router.get('/', asyncHandler(async (req, res) => {
  const queryResult = validateInput(whoisQuerySchema, req.query);
  
  if (!queryResult.success) {
    throw new OperationalError('Invalid query parameters', 400, queryResult.errors.flatten());
  }
  
  const domain = queryResult.data.domain;
  
  // Use RDAP service to get registration data
  const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
  
  logger.info('WHOIS lookup started', { domain });
  
  let rdapResponse: unknown;
  let createdAt: string | null = null;
  let ageDays: number | null = null;
  
  try {
    const resp = await fetch(rdapUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!resp.ok) {
      logger.warn('RDAP request failed', { domain, status: resp.status });
      throw new OperationalError('WHOIS service unavailable', 502);
    }
    
    rdapResponse = await resp.json();
    
    // Parse RDAP response
    const json = rdapResponse as Record<string, unknown>;
    
    // Try to locate a registration/creation date
    if (Array.isArray(json.events)) {
      for (const ev of json.events as Array<{ eventAction?: string; eventDate?: string }>) {
        const action = String(ev.eventAction ?? '')?.toLowerCase();
        if ((/create|registration|registration-date|registered/).test(action) && ev.eventDate) {
          createdAt = ev.eventDate;
          break;
        }
      }
    }
    
    // Some RDAP variants include 'registrar' or 'created' fields
    if (!createdAt && json.created) {
      createdAt = String(json.created);
    }
    
    if (createdAt) {
      const createdDate = new Date(createdAt);
      if (!isNaN(createdDate.getTime())) {
        ageDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    
  } catch (error) {
    logger.error('WHOIS lookup error', { domain, error: String(error) });
    
    // Return a fallback response instead of throwing
    res.json({
      success: true,
      data: {
        domain,
        createdAt: null,
        ageDays: null,
        error: error instanceof Error ? error.message : 'WHOIS lookup failed',
        source: 'rdap',
      },
    });
    return;
  }
  
  logger.info('WHOIS lookup completed', {
    domain,
    createdAt,
    ageDays,
  });
  
  res.json({
    success: true,
    data: {
      domain,
      createdAt,
      ageDays,
      source: 'rdap',
      metadata: {
        checkedAt: new Date().toISOString(),
        service: 'rdap.org',
      },
    },
  });
}));

export default router;
