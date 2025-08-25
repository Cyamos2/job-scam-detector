// src/lib/urlTools.ts
export function isLikelyUrl(input: string): boolean {
    if (!input) return false;
    const s = input.trim();
    // accept with or without protocol
    const rx = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\S*)$/i;
    return rx.test(s);
  }
  
  export function normalizeUrl(input: string): string {
    let s = input.trim();
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    return s;
  }
  
  export function getDomain(u: string): string | null {
    try {
      const url = new URL(normalizeUrl(u));
      return url.hostname.toLowerCase();
    } catch {
      return null;
    }
  }