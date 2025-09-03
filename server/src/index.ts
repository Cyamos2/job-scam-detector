import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import jobsRouter from './routes/jobs.js';
import verifyRouter from './routes/verify.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/jobs', jobsRouter);
app.use('/verify', verifyRouter);

// Basic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error', detail: String(err?.message ?? err) });
});

const PORT = Number(process.env.PORT ?? 3000);
const HOST = String(process.env.HOST ?? '0.0.0.0');

app.listen(PORT, HOST, () => {
  console.log(`🚀 API listening at http://${HOST}:${PORT}`);
});