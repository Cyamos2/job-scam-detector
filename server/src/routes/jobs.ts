import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import { validateInput, jobCreateSchema, jobUpdateSchema, jobIdSchema, jobFilterSchema, sanitizeInput } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/v1/jobs
 * Get all jobs with optional filtering and pagination
 */
router.get('/', asyncHandler(async (req, res) => {
  // Validate query parameters
  const filterResult = validateInput(jobFilterSchema, req.query);
  
  if (!filterResult.success) {
    throw new OperationalError('Invalid query parameters', 400, filterResult.errors.flatten());
  }
  
  const { page, limit, risk, search, sortBy, sortOrder } = filterResult.data;
  const skip = (page - 1) * limit;
  
  // Build where clause
  const where: Record<string, unknown> = {};
  
  if (risk !== 'all') {
    where.risk = risk;
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { company: { contains: search } },
      { url: { contains: search } },
    ];
  }
  
  // Execute query with timing
  const startTime = Date.now();
  
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);
  
  const duration = Date.now() - startTime;
  
  logger.dbOperation('job.findMany', duration, true, {
    filter: { risk, search },
    count: jobs.length,
    total,
  });
  
  res.json({
    success: true,
    data: jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

/**
 * GET /api/v1/jobs/:id
 * Get a single job by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const idResult = validateInput(jobIdSchema, req.params);
  
  if (!idResult.success) {
    throw new OperationalError('Invalid job ID', 400, idResult.errors.flatten());
  }
  
  const job = await prisma.job.findUnique({
    where: { id: idResult.data.id },
  });
  
  if (!job) {
    throw new OperationalError('Job not found', 404);
  }
  
  res.json({
    success: true,
    data: job,
  });
}));

/**
 * POST /api/v1/jobs
 * Create a new job
 */
router.post('/', asyncHandler(async (req, res) => {
  const bodyResult = validateInput(jobCreateSchema, req.body);
  
  if (!bodyResult.success) {
    throw new OperationalError('Validation failed', 400, bodyResult.errors.flatten());
  }
  
  const sanitizedData = sanitizeInput(bodyResult.data);
  
  const job = await prisma.job.create({
    data: sanitizedData,
  });
  
  logger.info('Job created', { jobId: job.id, company: job.company });
  
  res.status(201).json({
    success: true,
    data: job,
  });
}));

/**
 * PATCH /api/v1/jobs/:id
 * Update a job
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const [idResult, bodyResult] = [
    validateInput(jobIdSchema, req.params),
    validateInput(jobUpdateSchema, req.body),
  ];
  
  if (!idResult.success) {
    throw new OperationalError('Invalid job ID', 400, idResult.errors.flatten());
  }
  
  if (!bodyResult.success) {
    throw new OperationalError('Validation failed', 400, bodyResult.errors.flatten());
  }
  
  const sanitizedData = sanitizeInput(bodyResult.data);
  
  // Check if job exists
  const existing = await prisma.job.findUnique({
    where: { id: idResult.data.id },
  });
  
  if (!existing) {
    throw new OperationalError('Job not found', 404);
  }
  
  const job = await prisma.job.update({
    where: { id: idResult.data.id },
    data: sanitizedData,
  });
  
  logger.info('Job updated', { jobId: job.id });
  
  res.json({
    success: true,
    data: job,
  });
}));

/**
 * DELETE /api/v1/jobs/:id
 * Delete a job
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const idResult = validateInput(jobIdSchema, req.params);
  
  if (!idResult.success) {
    throw new OperationalError('Invalid job ID', 400, idResult.errors.flatten());
  }
  
  // Check if job exists
  const existing = await prisma.job.findUnique({
    where: { id: idResult.data.id },
  });
  
  if (!existing) {
    throw new OperationalError('Job not found', 404);
  }
  
  await prisma.job.delete({
    where: { id: idResult.data.id },
  });
  
  logger.info('Job deleted', { jobId: idResult.data.id, company: existing.company });
  
  res.json({
    success: true,
    message: 'Job deleted successfully',
  });
}));

/**
 * GET /api/v1/jobs/stats/summary
 * Get job statistics
 */
router.get('/stats/summary', asyncHandler(async (_req, res) => {
  const [total, byRisk, recent] = await Promise.all([
    prisma.job.count(),
    prisma.job.groupBy({
      by: ['risk'],
      _count: true,
    }),
    prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, company: true, risk: true, createdAt: true },
    }),
  ]);
  
  const riskCounts = {
    high: 0,
    medium: 0,
    low: 0,
  };
  
  for (const item of byRisk) {
    riskCounts[item.risk] = item._count;
  }
  
  res.json({
    success: true,
    data: {
      total,
      byRisk: riskCounts,
      recent,
    },
  });
}));

export default router;
