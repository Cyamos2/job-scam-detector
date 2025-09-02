import express from "express";
import cors from "cors";
import jobsRouter from "./routes/jobs";

const app = express();

// Permissive CORS in dev
app.use(cors());
app.use(express.json());

// Health endpoints
app.get("/", (_req, res) => res.send("API is running 🚀"));
app.get("/ping", (_req, res) => res.status(200).send("pong")); // <= used by mobile auto-probe

// Routes
app.use("/jobs", jobsRouter);

const port = Number(process.env.PORT || 4000);

// IMPORTANT: bind to 0.0.0.0 so phones on the same Wi-Fi can reach it
app.listen(port, "0.0.0.0", () => {
  console.log(`API server running on port ${port} (bound to 0.0.0.0)`);
  console.log(`iOS simulator:   http://localhost:${port}`);
  console.log(`Android emulator: http://10.0.2.2:${port}`);
});