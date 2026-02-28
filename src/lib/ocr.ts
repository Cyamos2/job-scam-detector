import api from "./db";

// On-device OCR (ML Kit) with fallback to server-side OCR and demo text.
export type OCRResult = { text: string; confidence?: number | null };

/**
 * Check if ML Kit text recognition is available at runtime
 */
export async function isMlKitAvailable(): Promise<boolean> {
  // Expo Go and managed Expo do not support native MLKit
  return false;
}

export async function extractTextFromImage(imageOrBase64OrUri: string): Promise<OCRResult> {
  const original = String(imageOrBase64OrUri || "");








    // MLKit is not available in Expo, always use server-side OCR

  // Next: try server-side OCR if available
  try {
    // Accept both base64 and URI: server expects base64, so try to extract base64 if it's a data URI
    let b64 = original.replace(/^data:.*;base64,/, "");
    // If it's a URI (file:// or content:// or http), prefer client-side upload path (not implemented), so fall back to server only for base64
    if (b64 && b64.length > 0 && !/^https?:\/\//i.test(original)) {
      const res = await api.ocr(b64);
      // Handle the wrapped response format: { success: true, data: { text, confidence, ... } }
      const ocrData = (res as any).success && (res as any).data ? (res as any).data : res;
      if (ocrData && typeof ocrData.text === "string") {
        console.log(`[OCR] Server OCR success: ${ocrData.text.length} chars`);
        return { text: ocrData.text as string, confidence: ocrData.confidence ?? null };
      }
    }
  } catch (err) {
    console.log("[OCR] Server OCR error:", err);
    // ignore and fall through to demo
  }

  // Return demo fallback for development/testing
  console.log("[OCR] Using demo fallback");
  return { text: demoFallback(), confidence: null };
}

/**
 * Clean up any temporary OCR cache files older than `ttlMs` in FileSystem.cacheDirectory
 */
export async function cleanupOcrCache(ttlMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const FileSystem = await import("expo-file-system").then((m) => (m && (m as any).default) || m);
    if (!FileSystem?.readDirectoryAsync || !FileSystem?.getInfoAsync || !FileSystem?.deleteAsync) return;

    const files: string[] = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
    const now = Date.now();
    await Promise.all(files.map(async (file) => {
      try {
        if (!file.startsWith('ocr-')) return;
        const info = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + file);
        if (!info.exists || !info.modificationTime) {
          // Ignore
          return;
        }
        // modificationTime is in seconds on some implementations — normalize
        const mtimeMs = info.modificationTime && info.modificationTime < 1e12 ? info.modificationTime * 1000 : info.modificationTime;
        if (now - (mtimeMs || now) > ttlMs) {
          await FileSystem.deleteAsync(FileSystem.cacheDirectory + file, { idempotent: true }).catch(() => {});
        }
      } catch (_) {
        // ignore per-file errors
      }
    }));
  } catch (e) {
    // ignore
  }
}

function extractTextFromMlResult(res: any): string {
  if (!res) return "";
  if (typeof res === "string") return res.trim();
  if (typeof res?.text === "string") return res.text.trim();

  // Tesseract-like result: data.words or lines
  if (Array.isArray(res)) return res.map((r) => (r?.text ? String(r.text) : String(r))).join("\n").trim();

  if (Array.isArray(res?.blocks)) return res.blocks.map((b: any) => b.text).join("\n").trim();
  if (Array.isArray(res?.lines)) return res.lines.map((l: any) => l.text).join("\n").trim();

  return String(res).trim();
}

function demoFallback(): string {
  return "[Demo OCR] Extracted text from screenshot. Replace this stub with a real OCR implementation (Vision/MLKit on-device or server-side).";
}

