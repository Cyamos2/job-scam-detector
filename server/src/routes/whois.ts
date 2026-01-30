import { Router } from 'express';
import fetch from 'node-fetch';
const router = Router();

// GET /whois?domain=example.com
router.get('/', async (req, res) => {
  const domain = (req.query.domain as string | undefined)?.trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'missing domain' });

  try {
    // Use public RDAP service to get registration data
    const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
    const resp = await fetch(rdapUrl, { method: 'GET' });
    if (!resp.ok) {
      return res.status(502).json({ error: 'rdap_unavailable', status: resp.status });
    }
    const json = await resp.json();

    // Try to locate a registration/creation date
    let createdAt: string | null = null;
    if (Array.isArray(json.events)) {
      for (const ev of json.events) {
        const action = String(ev.eventAction ?? '')?.toLowerCase();
        if ((/create|registration|registration-date|registered/).test(action) && ev.eventDate) {
          createdAt = ev.eventDate;
          break;
        }
      }
    }

    // Some RDAP variants include 'registrar' or 'created' fields
    if (!createdAt && json.created) {
      createdAt = json.created;
    }

    const ageDays = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)) : null;

    res.json({ domain, createdAt, ageDays, rdap: { summarised: { handle: json.handle ?? null, names: json.name ?? json.ldhName ?? null } } });
  } catch (err: unknown) {
    res.status(500).json({ error: 'whois_error', detail: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
