// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// ===== Conectare MongoDB =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB Atlas"))
  .catch((err) => console.error("❌ Eroare Mongo:", err.message));

// ===== Ruta test =====
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funcționează corect 🚀" });
});

// ===== Pornire server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server oltenitaimobiliare pornit pe portul ${PORT}`)
);
