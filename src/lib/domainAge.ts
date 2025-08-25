// src/lib/domainAge.ts
// RDAP-based domain age lookup with timeout + robust parsing (no API key).

export type DomainAge = {
    created?: string;     // ISO date string
    ageDays?: number;     // days since creation
    registry?: string;    // registry/registrar when available
    domain?: string;      // normalized domain (lowercase)
  };
  
  function parseCreated(events: any[]): string | undefined {
    if (!Array.isArray(events)) return undefined;
    // Prefer explicit "registration", fall back to earliest event
    let created: string | undefined;
    for (const ev of events) {
      if (ev?.eventAction?.toLowerCase?.() === "registration" && ev?.eventDate) {
        created = ev.eventDate;
        break;
      }
    }
    if (!created) {
      const dt = events
        .map((e) => e?.eventDate)
        .filter(Boolean)
        .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())[0];
      created = dt;
    }
    return created;
  }
  
  export async function getDomainAge(domainInput: string, timeoutMs = 12000): Promise<DomainAge> {
    const domain = domainInput.trim().toLowerCase();
    const url = `https://rdap.org/domain/${domain}`;
  
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
  
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
  
      if (!res.ok) return { domain }; // RDAP not found or blocked
      const data = await res.json();
  
      const created = parseCreated(data?.events || []);
      if (!created) return { domain };
  
      const createdDate = new Date(created);
      if (isNaN(createdDate.getTime())) return { domain };
  
      const now = new Date();
      const ageDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
      // Some RDAPs expose registrar/registry at different places
      const registry =
        data?.registrar?.name ||
        data?.entities?.find((e: any) => /registrar/i.test(e?.roles?.join(",") || ""))?.vcardArray?.[1]?.find?.(
          (v: any[]) => v?.[0] === "fn"
        )?.[3] ||
        undefined;
  
      return { domain, created: createdDate.toISOString(), ageDays, registry };
    } catch (_e) {
      clearTimeout(t);
      return { domain };
    }
  }