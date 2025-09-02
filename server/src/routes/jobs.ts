import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

type Query = {
  risk?: string;
  search?: string;
  limit?: string;
  offset?: string;
};

const toInt = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// GET /jobs?risk=LOW|MEDIUM|HIGH&search=foo&limit=50&offset=0
router.get("/", async (req, res) => {
  const { risk, search, limit, offset } = req.query as Query;

  const where: any = {};
  if (risk && ["LOW", "MEDIUM", "HIGH"].includes(risk.toUpperCase())) {
    where.risk = risk.toUpperCase();
  }
  if (search?.trim()) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const take = Math.max(1, Math.min(100, toInt(limit, 50)));
  const skip = Math.max(0, toInt(offset, 0));

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { images: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.job.count({ where }),
  ]);

  res.json({ items, total });
});

// POST /jobs
router.post("/", async (req, res) => {
  const { title, company, score = 0, risk = "LOW", source, url, email, notes, images = [] } = req.body || {};

  if (!title || !company) {
    return res.status(400).json({ error: "title and company are required" });
  }

  const job = await prisma.job.create({
    data: {
      title: String(title).trim(),
      company: String(company).trim(),
      score: Number(score) || 0,
      risk: String(risk).toUpperCase(),
      source: source ? String(source) : null,
      url: url ? String(url) : null,
      email: email ? String(email) : null,
      notes: notes ? String(notes) : null,
      images: { create: (images as string[]).map((uri) => ({ uri })) },
    },
    include: { images: true },
  });

  res.status(201).json(job);
});

// PUT /jobs/:id  (replace)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, company, score, risk, source, url, email, notes, images } = req.body || {};

  try {
    const job = await prisma.job.update({
      where: { id },
      data: {
        title: title ?? undefined,
        company: company ?? undefined,
        score: typeof score === "number" ? score : undefined,
        risk: typeof risk === "string" ? risk.toUpperCase() : undefined,
        source: source ?? undefined,
        url: url ?? undefined,
        email: email ?? undefined,
        notes: notes ?? undefined,
        ...(Array.isArray(images)
          ? {
              images: {
                deleteMany: {}, // wipe existing
                create: images.map((uri: string) => ({ uri })),
              },
            }
          : {}),
      },
      include: { images: true },
    });

    res.json(job);
  } catch {
    res.status(404).json({ error: "job not found" });
  }
});

// PATCH /jobs/:id  (partial update)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const data: any = {};
  for (const k of ["title", "company", "source", "url", "email", "notes"]) {
    if (k in req.body) data[k] = req.body[k];
  }
  if ("score" in req.body) data.score = Number(req.body.score) || 0;
  if ("risk" in req.body) data.risk = String(req.body.risk).toUpperCase();

  try {
    const job = await prisma.job.update({ where: { id }, data, include: { images: true } });
    res.json(job);
  } catch {
    res.status(404).json({ error: "job not found" });
  }
});

// DELETE /jobs/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // thanks to onDelete: Cascade, images go automatically
    await prisma.job.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "job not found" });
  }
});

export default router;