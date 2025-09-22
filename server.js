// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

// Middleware
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Conectare MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB Atlas"))
  .catch((err) => console.error("❌ Eroare MongoDB:", err));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend OltenitaImobiliare funcționează 🚀" });
});

// Start server
app.listen(PORT, () => console.log(`✅ Server pornit pe portul ${PORT}`));
