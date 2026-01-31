import api from "./db";

// On-device OCR (ML Kit) with fallback to server-side OCR and demo text.
export type OCRResult = { text: string; confidence?: number | null };

export async function extractTextFromImage(imageOrBase64OrUri: string): Promise<OCRResult> {
  const original = String(imageOrBase64OrUri || "");

  // Try on-device ML Kit first
  try {
    // Dynamic import so Metro doesn't bundle native module if it's not available
    const mlkitModule = await import("react-native-mlkit-text-recognition").then((m) => (m && (m as any).default) || m);
    if (mlkitModule) {
      // Normalize input to a local file path (ML Kit expects a file URI)
      let imagePath = original;

      // If base64/data URI, write to cache using expo-file-system
      if (/^data:.*;base64,/.test(original) || /^[A-Za-z0-9+/=\s]+$/.test(original)) {
        try {
          const FileSystem = await import("expo-file-system").then((m) => (m && (m as any).default) || m);
          const base64 = original.replace(/^data:.*;base64,/, "");
          const dest = FileSystem.cacheDirectory + `ocr-${Date.now()}.jpg`;
          await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });
          imagePath = dest;
        } catch (e) {
          // If we can't write a file, fall back to next method
          imagePath = original;
        }
      }

      // If HTTP URL, ML Kit can't read remote URLs directly; try server fallback instead
      if (/^https?:\/\//i.test(imagePath)) {
        throw new Error("Remote URLs are not supported by ML Kit on-device; falling back to server OCR");
      }

      // Try several common function names that variants of the package might expose
      const recognizeFn = (mlkitModule as any).recognize || (mlkitModule as any).recognizeText || (mlkitModule as any).default?.recognize;
      if (typeof recognizeFn === "function") {
        let tempFilePath: string | null = null;
        try {
          // If we wrote a cache file above, remember it so we can clean it up
          if (/^data:.*;base64,/.test(original) || /^[A-Za-z0-9+\/=\s]+$/.test(original)) {
            tempFilePath = imagePath;
          }

          const res = await recognizeFn(String(imagePath));

          const text = extractTextFromMlResult(res);

          // Try to compute average confidence when available
          let confidence: number | null = null;
          try {
            const words = Array.isArray(res?.words) ? res.words : Array.isArray(res?.lines) ? res.lines.flatMap((l: any) => l.words ?? []) : [];
            if (words.length > 0) {
              const sum = words.reduce((s: number, w: any) => s + (Number(w.confidence) || 0), 0);
              confidence = Math.round((sum / words.length) * 100) / 100;
            }
          } catch (err) {
            // ignore
          }

          if (text) return { text, confidence };
        } finally {
          // Clean up temporary cache file if we created one
          if (tempFilePath) {
            try {
              const FileSystem = await import("expo-file-system").then((m) => (m && (m as any).default) || m);
              if (FileSystem?.deleteAsync) {
                await FileSystem.deleteAsync(tempFilePath, { idempotent: true }).catch(() => {});
              }
            } catch (_) {
              // ignore cleanup errors
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignore and continue to server fallback
  }

  // Next: try server-side OCR if available
  try {
    // Accept both base64 and URI: server expects base64, so try to extract base64 if it's a data URI
    let b64 = original.replace(/^data:.*;base64,/, "");
    // If it's a URI (file:// or content:// or http), prefer client-side upload path (not implemented), so fall back to server only for base64
    if (b64 && b64.length > 0 && !/^https?:\/\//i.test(original)) {
      const res = await api.ocr(b64);
      if (res && (res as any).success && (res as any).data && typeof (res as any).data.text === "string") {
        return { text: (res as any).data.text as string, confidence: (res as any).data.confidence ?? null };
      }
    }
  } catch (err) {
    // ignore and fall through to demo
  }

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