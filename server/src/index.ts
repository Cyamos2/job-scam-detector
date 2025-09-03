// server/src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { prisma } from "./prisma.js";
import jobsRouter from "./routes/jobs.js";
import verifyRouter from "./routes/verify.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // allow all origins (safe for dev; restrict in prod)
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Routes
app.use("/jobs", jobsRouter);
app.use("/verify", verifyRouter);

// Error handler
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "internal_error",
      detail: String(err?.message ?? err),
    });
  }
);

// Server listen
const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, HOST, () => {
  console.log(`🚀 API listening at http://${HOST}:${PORT}`);
});