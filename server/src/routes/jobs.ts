import { Router } from "express";
import { prisma } from "../prisma";  // using named export from prisma.ts

const router = Router();

// GET /jobs → list all jobs
router.get("/", async (_req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (err) {
    console.error("[ERROR] GET /jobs:", err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// GET /jobs/:id → get a single job
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

// POST /jobs → create a job
router.post("/", async (req, res) => {
  try {
    const { title, company, url, email, source, risk, score, notes, images } =
      req.body;

    const job = await prisma.job.create({
      data: {
        title,
        company,
        url,
        email,
        source,
        risk,
        score,
        notes,
        images: {
          create: (images || []).map((uri: string) => ({ uri })),
        },
      },
      include: { images: true },
    });

    res.status(201).json(job);
  } catch (err) {
    console.error("[ERROR] POST /jobs:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// DELETE /jobs → bulk delete
router.delete("/", async (req, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!ids?.length) {
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