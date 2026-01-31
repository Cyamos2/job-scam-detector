import { Router } from 'express';
import { asyncHandler, OperationalError } from '../middleware/errorHandler.js';
import logger, { loggers } from '../utils/logger.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

// We lazily import tesseract to avoid startup cost when not used
let workerInstance: any = null;
let workerInitializing = false;

const router = Router();

// Simple in-memory cache: key -> { text, confidence, expiresAt }
const cache = new Map<string, { text: string; confidence: number | null; expiresAt: number }>();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function makeCacheKey(payload: { imageBase64?: string; imageUrl?: string }) {
  if (payload.imageUrl) return `url:${payload.imageUrl}`;
  if (payload.imageBase64) return `b64:${payload.imageBase64.slice(0, 200)}`; // truncate for key size
  return 'empty';
}

async function ensureWorker() {
  if (workerInstance) return workerInstance;
  if (workerInitializing) {
    // spin until initialized (simple): wait until instance is ready
    while (workerInitializing && !workerInstance) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return workerInstance;
  }

  workerInitializing = true;
  try {
    // Dynamically import to avoid adding load cost if not used
    const tesseract = await import('tesseract.js');
    workerInstance = tesseract.createWorker({ logger: (m: any) => loggers.debug('tesseract', m) });
    await workerInstance.load();
    await workerInstance.loadLanguage('eng');
    await workerInstance.initialize('eng');
    logger.info('Tesseract worker initialized');
    return workerInstance;
  } catch (error) {
    logger.error('Failed to initialize tesseract worker', { error: String(error) });
    workerInstance = null;
    throw new OperationalError('OCR initialization failed', 500);
  } finally {
    workerInitializing = false;
  }
}

// Rate limiter: 20 requests per hour per IP/apiKey
const ocrRateLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20, message: 'OCR rate limit exceeded.' });

/**
 * POST /api/v1/ocr
 * Body: { imageBase64?: string, imageUrl?: string }
 * Returns: { success: true, data: { text, confidence } }
 */
router.post('/', ocrRateLimiter, asyncHandler(async (req, res) => {
  const { imageBase64, imageUrl } = req.body ?? {};

  if (!imageBase64 && !imageUrl) {
    throw new OperationalError('Missing image payload', 400);
  }

  const key = makeCacheKey({ imageBase64, imageUrl });
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    logger.info('OCR cache hit', { key });
    res.json({ success: true, data: { text: cached.text, confidence: cached.confidence, cached: true } });
    return;
  }

  // If imageUrl is provided, fetch it
  let imageBuffer: Buffer | null = null;
  try {
    if (imageUrl) {
      logger.info('Fetching remote image for OCR', { imageUrl });
      const resp = await fetch(String(imageUrl));
      if (!resp.ok) throw new OperationalError('Failed to fetch image', 400);
      const ab = await resp.arrayBuffer();
      imageBuffer = Buffer.from(ab);
    } else if (imageBase64) {
      // Expect base64 without data: prefix but tolerate it
      const b64 = String(imageBase64).replace(/^data:.*;base64,/, '');
      imageBuffer = Buffer.from(b64, 'base64');
    }

    if (!imageBuffer) throw new OperationalError('Image payload could not be processed', 400);

  } catch (error) {
    logger.error('Image fetch/parse failed', { error: String(error) });
    throw new OperationalError('Image processing failed', 400);
  }

  // Ensure tesseract worker
  try {
    const worker = await ensureWorker();

    logger.info('Starting OCR recognition');
    const result = await worker.recognize(imageBuffer);
    const text = String(result?.data?.text ?? '').trim();

    // Compute average confidence if available
    let confidence: number | null = null;
    try {
      const words = Array.isArray(result?.data?.words) ? result.data.words : [];
      if (words.length > 0) {
        const sum = words.reduce((s: number, w: any) => s + (Number(w.confidence) || 0), 0);
        confidence = Math.round((sum / words.length) * 100) / 100; // two decimals
      }
    } catch (e) {
      // ignore
    }

    // Cache result
    cache.set(key, { text, confidence, expiresAt: Date.now() + DEFAULT_TTL_MS });

    logger.info('OCR completed', { length: text.length, confidence });

    res.json({ success: true, data: { text, confidence, cached: false } });

  } catch (error) {
    logger.error('OCR recognition failed', { error: String(error) });
    // Return graceful fallback
    res.json({ success: true, data: { text: '', confidence: null, error: error instanceof Error ? error.message : 'OCR failed' } });
  }
}));

export default router;
