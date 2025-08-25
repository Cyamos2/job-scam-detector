// src/lib/html.ts
/** Very small HTML → text extractor (no deps). Good enough for heuristics. */
export function htmlToText(html: string): string {
    // remove scripts/styles/noscript
    let s = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  
    // block-level tags -> newlines
    s = s.replace(/<\/(p|div|section|article|li|ul|ol|h[1-6]|br|tr|table)>/gi, "\n");
  
    // strip remaining tags
    s = s.replace(/<[^>]+>/g, " ");
  
    // decode a few entities
    s = s
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  
    // collapse whitespace
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }