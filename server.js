// server.js minimal pentru test
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// Config
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Conexiune MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB Atlas"))
  .catch((err) => console.error("❌ Eroare MongoDB:", err.message));

// Ruta test
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funcționează corect 🚀" });
});

// Pornire server
app.listen(PORT, () => {
  console.log(`✅ Server pornit pe portul ${PORT}`);
});
