// src/lib/ocr.ts
// MVP OCR stub. Replace `extractTextFromImage` with a real OCR later.
export type OcrResult = { text: string; warning?: string };

export async function extractTextFromImage(_uri: string): Promise<OcrResult> {
  // TODO: integrate a real OCR:
  // - Serverless: upload to your API -> Google Vision/Azure OCR/Claude
  // - Native: vision-camera + MLKit (requires custom dev build)
  return {
    text: '',
    warning:
      'OCR not enabled yet. Paste text below, or replace OCR stub in src/lib/ocr.ts when ready.',
  };
}