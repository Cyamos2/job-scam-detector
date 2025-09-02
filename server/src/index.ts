import express from "express";
import cors from "cors";
import jobsRouter from "./routes/jobs";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("API is running 🚀"));
app.use("/jobs", jobsRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API server running at http://localhost:${port}`));