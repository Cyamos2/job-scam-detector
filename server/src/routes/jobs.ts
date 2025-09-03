import { Router } from 'express';
import { prisma } from '../prisma.js';

const router = Router();

// GET /jobs
router.get('/', async (_req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (e) { next(e); }
});

// POST /jobs
router.post('/', async (req, res, next) => {
  try {
    const { title, company, url, risk = 'low', notes } = req.body ?? {};
    if (!title || !company) return res.status(400).json({ error: 'title and company are required' });
    const job = await prisma.job.create({
      data: { title, company, url, risk, notes }
    });
    res.status(201).json(job);
  } catch (e) { next(e); }
});

// PATCH /jobs/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.update({
      where: { id },
      data: req.body ?? {}
    });
    res.json(job);
  } catch (e) { next(e); }
});

// DELETE /jobs/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.job.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;