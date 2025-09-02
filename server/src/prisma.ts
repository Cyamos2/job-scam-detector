import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});