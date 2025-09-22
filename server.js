// server.js - backend minim pentru test
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/test";

// ✅ Rută test
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funcționează corect 🚀" });
});

// ✅ Conexiune Mongo
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB Atlas"))
  .catch((err) => console.error("❌ Eroare Mongo:", err.message));

// ✅ Pornire server
app.listen(PORT, () => {
  console.log(`✅ Server pornit pe portul ${PORT}`);
});
