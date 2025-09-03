import { Router } from 'express';
const router = Router();

/**
 * GET /verify?target=<url or company>
 * Returns a naive verdict today; upgrade with real checks later.
 */
router.get('/', async (req, res) => {
  const target = (req.query.target as string | undefined)?.trim();
  if (!target) return res.status(400).json({ error: 'missing target' });

  // very naive signals for now
  const signals: Array<{ label: string; score: number }> = [];
  const lc = target.toLowerCase();

  if (/linkedin\.com\/(jobs|company)/.test(lc)) signals.push({ label: 'LinkedIn URL', score: 0.2 });
  if (/https?:\/\//.test(lc)) signals.push({ label: 'Has URL', score: 0.1 });
  if (/gmail|yahoo|outlook/.test(lc)) signals.push({ label: 'Freemail domain in text', score: 0.6 });
  if (/telegram|whatsapp|gift card|crypto/i.test(target)) signals.push({ label: 'Scam trigger words', score: 0.8 });

  const risk = Math.min(1, signals.reduce((s, x) => s + x.score, 0));
  const verdict = risk < 0.3 ? 'low' : risk < 0.6 ? 'medium' : 'high';

  res.json({ target, verdict, risk, signals });
});

export default router;