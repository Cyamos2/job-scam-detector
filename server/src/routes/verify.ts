import { Router } from 'express';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import { validateInput, verifyQuerySchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/v1/verify?target=<url or company>
 * Returns a naive verdict; upgrade with real checks later.
 */
router.get('/', asyncHandler(async (req, res) => {
  const queryResult = validateInput(verifyQuerySchema, req.query);
  
  if (!queryResult.success) {
    throw new OperationalError('Invalid query parameters', 400, queryResult.errors.flatten());
  }
  
  const target = queryResult.data.target;
  const signals: Array<{ label: string; score: number; category: string }> = [];
  const lc = target.toLowerCase();

  // LinkedIn verification
  if (/linkedin\.com\/(jobs|company|company\/)/i.test(lc)) {
    signals.push({ label: 'LinkedIn URL', score: 0.2, category: 'platform' });
  }
  
  // URL presence
  if (/https?:\/\//i.test(lc)) {
    signals.push({ label: 'Has URL', score: 0.1, category: 'format' });
  }
  
  // Free email domains in text
  if (/gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com/i.test(lc)) {
    signals.push({ label: 'Freemail domain in text', score: 0.6, category: 'contact' });
  }
  
  // Scam trigger words
  const scamTriggers = [
    { pattern: /telegram/i, label: 'Telegram contact' },
    { pattern: /whatsapp/i, label: 'WhatsApp contact' },
    { pattern: /signal/i, label: 'Signal contact' },
    { pattern: /gift\s*card/i, label: 'Gift card payment mentioned' },
    { pattern: /crypto|cryptocurrency|bitcoin/i, label: 'Cryptocurrency mentioned' },
    { pattern: /wire\s*transfer/i, label: 'Wire transfer requested' },
    { pattern: /zelle|cash\s*app|venmo/i, label: 'Peer payment app mentioned' },
    { pattern: /upfront\s*(fee|payment)/i, label: 'Upfront fee requested' },
    { pattern: /training\s*fee/i, label: 'Training fee mentioned' },
    { pattern: /equipment\s*purchase/i, label: 'Equipment purchase required' },
    { pattern: /immediate\s*start|start\s*today/i, label: 'Pressure to start immediately' },
    { pattern: /no\s*interview/i, label: 'No interview required' },
    { pattern: /work\s*from\s*home/i, label: 'Remote work mentioned' },
    { pattern: /part\s*time/i, label: 'Part-time mentioned' },
    { pattern: /\$([4-9]\d|\d{3,})/i, label: 'High salary mentioned' },
  ];
  
  for (const trigger of scamTriggers) {
    if (trigger.pattern.test(target)) {
      signals.push({ label: trigger.label, score: 0.8, category: 'scam_trigger' });
    }
  }
  
  // Calculate overall risk score
  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
  const risk = Math.min(1, totalScore);
  
  // Determine verdict
  const verdict = risk < 0.3 ? 'low' : risk < 0.6 ? 'medium' : 'high';
  
  // Log verification request
  logger.info('Verification performed', {
    targetLength: target.length,
    signalsCount: signals.length,
    verdict,
    riskScore: risk,
  });
  
  res.json({
    success: true,
    data: {
      target,
      verdict,
      risk: Math.round(risk * 100) / 100,
      signals,
      metadata: {
        checkedAt: new Date().toISOString(),
        signalsCount: signals.length,
      },
    },
  });
}));

export default router;
