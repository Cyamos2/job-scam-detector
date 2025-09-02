import { Router, Request, Response } from "express";
import { prisma } from "../prisma";

const router = Router();

/** LIST: GET /jobs?risk=LOW|MEDIUM|HIGH&search=text */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { risk, search } = req.query as { risk?: string; search?: string };
    const where: any = {};

    if (risk && ["LOW", "MEDIUM", "HIGH"].includes(risk.toUpperCase())) {
      where.risk = risk.toUpperCase();
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (err) {
    console.error("[ERROR] GET /jobs:", err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

/** CREATE: POST /jobs  */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, company, url, email, source, risk, score, notes, images } = req.body || {};
    if (!title || !company) {
      return res.status(400).json({ error: "title and company are required" });
    }

    const created = await prisma.job.create({
      data: {
        title: String(title),
        company: String(company),
        url: url ?? null,
        email: email ?? null,
        source: source ?? null,
        risk: String(risk || "LOW").toUpperCase(),
        score: Number(score) || 0,
        notes: notes ?? null,
        images: { create: (Array.isArray(images) ? images : []).map((uri: string) => ({ uri })) },
      },
      include: { images: true },
    });
    console.log("[POST /jobs] created", created.id, created.title);
    res.status(201).json(created);
  } catch (err) {
    console.error("[ERROR] POST /jobs:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

/** UPDATE: PATCH /jobs/:id  */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { title, company, url, email, source, risk, score, notes, images } = req.body || {};
    const updates: any = {};
    if (title !== undefined) updates.title = String(title);
    if (company !== undefined) updates.company = String(company);
    if (url !== undefined) updates.url = url ?? null;
    if (email !== undefined) updates.email = email ?? null;
    if (source !== undefined) updates.source = source ?? null;
    if (risk !== undefined) updates.risk = String(risk).toUpperCase();
    if (score !== undefined) updates.score = Number(score) || 0;
    if (notes !== undefined) updates.notes = notes ?? null;

    const updated = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        ...updates,
        ...(images !== undefined && {
          images: {
            deleteMany: { jobId: req.params.id },
            create: (Array.isArray(images) ? images : []).map((uri: string) => ({ uri })),
          },
        }),
      },
      include: { images: true },
    });
    console.log("[PATCH /jobs/:id] updated", updated.id);
    res.json(updated);
  } catch (err) {
    console.error("[ERROR] PATCH /jobs/:id:", err);
    res.status(500).json({ error: "Failed to update job" });
  }
});

/** DELETE ONE: DELETE /jobs/:id */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.image.deleteMany({ where: { jobId: req.params.id } });
    const j = await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ deleted: j.id });
  } catch (err) {
    console.error("[ERROR] DELETE /jobs/:id:", err);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

/** BULK DELETE: DELETE /jobs  { ids: string[] } */
router.delete("/", async (req: Request, res: Response) => {
  try {
    const ids = (req.body?.ids ?? []) as string[];
    if (!ids.length) return res.status(400).json({ error: "No IDs provided" });

    await prisma.image.deleteMany({ where: { jobId: { in: ids } } });
    const result = await prisma.job.deleteMany({ where: { id: { in: ids } } });

    res.json({ deleted: result.count });
  } catch (err) {
    console.error("[ERROR] DELETE /jobs:", err);
    res.status(500).json({ error: "Failed to delete jobs" });
  }
});

export default router;