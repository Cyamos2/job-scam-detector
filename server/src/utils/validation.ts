import { z } from 'zod';

/**
 * Job validation schemas
 */
export const jobCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  company: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters')
    .trim(),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  recruiterEmail: z
    .string()
    .email('Invalid email format')
    .max(320, 'Email must be less than 320 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  url: z
    .string()
    .url('Invalid URL format')
    .max(2000, 'URL must be less than 2000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  risk: z
    .enum(['low', 'medium', 'high'])
    .default('low'),
  notes: z
    .string()
    .max(10000, 'Notes must be less than 10000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const jobUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  company: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters')
    .trim()
    .optional(),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  recruiterEmail: z
    .string()
    .email('Invalid email format')
    .max(320, 'Email must be less than 320 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  url: z
    .string()
    .url('Invalid URL format')
    .max(2000, 'URL must be less than 2000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  risk: z
    .enum(['low', 'medium', 'high'])
    .optional(),
  notes: z
    .string()
    .max(10000, 'Notes must be less than 10000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const jobIdSchema = z.object({
  id: z.string().cuid('Invalid job ID format'),
});

/**
 * Verification validation schemas
 */
export const verifyQuerySchema = z
  .object({
    company: z.string().max(200, 'Company name must be less than 200 characters').trim().optional(),
    url: z.string().url('Invalid URL format').max(2000, 'URL must be less than 2000 characters').optional(),
    target: z.string().max(500, 'Target must be less than 500 characters').trim().optional(),
  })
  .refine((val) => !!(val.company || val.url || val.target), {
    message: 'At least one of company, url, or target is required',
    path: ['target'],
  });

export const whoisQuerySchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(253, 'Invalid domain length')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
      'Invalid domain format'
    )
    .trim()
    .toLowerCase(),
});

export const patternsQuerySchema = z
  .object({
    company: z.string().max(200, 'Company name must be less than 200 characters').trim().optional(),
    url: z.string().url('Invalid URL format').max(2000, 'URL must be less than 2000 characters').optional(),
    recruiterEmail: z.string().email('Invalid email format').max(320, 'Email must be less than 320 characters').optional(),
  })
  .refine((val) => !!(val.company || val.url || val.recruiterEmail), {
    message: 'At least one of company, url, or recruiterEmail is required',
    path: ['company'],
  });

/**
 * Pagination schemas
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val: string | undefined) => Math.max(1, parseInt(val || '1', 10))),
  limit: z
    .string()
    .optional()
    .transform((val: string | undefined) => Math.min(100, Math.max(1, parseInt(val || '20', 10)))),
});

/**
 * Query filter schemas
 */
export const jobFilterSchema = z.object({
  ...paginationSchema.shape,
  risk: z
    .enum(['low', 'medium', 'high', 'all'])
    .optional()
    .default('all'),
  search: z
    .string()
    .trim()
    .max(200, 'Search term must be less than 200 characters')
    .optional(),
  sortBy: z
    .enum(['score', 'date', 'title', 'company'])
    .optional()
    .default('date'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

/**
 * Health check schema
 */
export const healthCheckSchema = z.object({
  includeDetails: z
    .string()
    .optional()
    .transform((val: string | undefined) => val === 'true'),
});

/**
 * Type exports for validated data
 */
export type JobCreateInput = z.infer<typeof jobCreateSchema>;
export type JobUpdateInput = z.infer<typeof jobUpdateSchema>;
export type JobIdParams = z.infer<typeof jobIdSchema>;
export type VerifyQuery = z.infer<typeof verifyQuerySchema>;
export type WhoisQuery = z.infer<typeof whoisQuerySchema>;
export type PatternsQuery = z.infer<typeof patternsQuerySchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type JobFilterParams = z.infer<typeof jobFilterSchema>;

/**
 * Validation helper function
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: z.ZodError };

export function validateInput<T>(
  schema: z.ZodType<T, any, any>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
} 

/**
 * Sanitize input by removing empty strings and trimming
 */
export function sanitizeInput<T extends Record<string, unknown>>(input: T): T {
  const sanitized = { ...input };
  
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key as keyof T];
    
    if (value === '') {
      delete sanitized[key as keyof T];
    } else if (typeof value === 'string') {
      sanitized[key as keyof T] = value.trim() as T[keyof T];
    }
  }
  
  return sanitized;
}

