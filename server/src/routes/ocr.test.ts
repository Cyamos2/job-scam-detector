import request from 'supertest';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Mock tesseract.js createWorker
vi.mock('tesseract.js', () => {
  return {
    createWorker: () => ({
      load: async () => {},
      loadLanguage: async () => {},
      initialize: async () => {},
      recognize: async (_input: any) => {
        return { data: { text: 'mocked text', words: [{ confidence: 95 }, { confidence: 85 }] } };
      },
    }),
  };
});

import app from '../index.js';

describe('OCR route', () => {
  it('returns recognized text for base64 payload', async () => {
    const res = await request(app)
      .post('/api/v1/ocr')
      .send({ imageBase64: 'ZmFrZQ==' })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.text).toContain('mocked text');
    expect(typeof res.body?.data?.confidence).toBe('number');
  });

  it('rejects missing payload', async () => {
    const res = await request(app)
      .post('/api/v1/ocr')
      .send({})
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body?.success).toBe(false);
  });
});
