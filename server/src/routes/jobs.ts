import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

// GET /jobs?risk=LOW|MEDIUM|HIGH&search=text
router.get("/", async (req, res) => {
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

// GET /jobs/:id → single job
router.get("/:id", async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });
    if (!job) return res.status(404).json({ error: "Not found" });
    res.json(job);
  } catch (err) {
    console.error("[ERROR] GET /jobs/:id:", err);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

// POST /jobs → create job
router.post("/", async (req, res) => {
  try {
    const { title, company, url, email, source, risk, score, notes, images } = req.body;
    const job = await prisma.job.create({
      data: {
        title,
        company,
        url,
        email,
        source,
        risk: risk?.toUpperCase() ?? "LOW",
        score: score ?? 0,
        notes,
        images: { create: (images ?? []).map((uri: string) => ({ uri })) },
      },
      include: { images: true },
    });
    res.status(201).json(job);
  } catch (err) {
    console.error("[ERROR] POST /jobs:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// DELETE /jobs → bulk delete { ids: string[] }
router.delete("/", async (req, res) => {
  try {
    const ids = (req.body?.ids ?? []) as string[];
    if (!ids.length) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    await prisma.image.deleteMany({ where: { jobId: { in: ids } } });
    const result = await prisma.job.deleteMany({ where: { id: { in: ids } } });

    res.json({ deleted: result.count });
  } catch (err) {
    console.error("[ERROR] DELETE /jobs:", err);
    res.status(500).json({ error: "Failed to delete jobs" });
  }
});

export default router;