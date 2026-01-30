// server/src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { prisma } from "./prisma.js";
import jobsRouter from "./routes/jobs.js";
import verifyRouter from "./routes/verify.js";
import whoisRouter from "./routes/whois.js";

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
app.use("/whois", whoisRouter);

// Error handler
app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof Error) console.error("Error:", err.message, err);
    else console.error("Error:", err);
    res.status(500).json({
      error: "internal_error",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
);

// Server listen
const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, HOST, () => {
  if (process.env.NODE_ENV !== "test") console.info(`🚀 API listening at http://${HOST}:${PORT}`);
});