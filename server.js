import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import jwt from "jsonwebtoken";

import authMiddleware from "./middleware/authMiddleware.js";
import Anunt from "./models/Anunt.js";
import User from "./models/User.js";

dotenv.config();
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// 🔹 Multer pentru fișiere (imagini locale / Cloudinary ulterior)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Conectare MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB Atlas"))
  .catch((err) => console.error("❌ Eroare MongoDB:", err));

// =======================
// ROUTES
// =======================

// ✅ Test
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funcționează corect 🚀" });
});

// ✅ Register
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Date invalide" });

    const user = new User({ email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error("❌ Eroare register:", err.message);
    res.status(500).json({ error: "Eroare server" });
  }
});

// ✅ Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ error: "Date de autentificare invalide" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error("❌ Eroare login:", err.message);
    res.status(500).json({ error: "Eroare server" });
  }
});

// ✅ Creare anunț (protejată de authMiddleware)
app.post("/api/anunturi", authMiddleware, upload.array("imagini", 10), async (req, res) => {
  try {
    console.log("👉 User din token:", req.user);
    console.log("👉 BODY primit:", req.body);
    console.log("👉 FISIERE:", req.files?.length);

    const { titlu, descriere, pret, categorie } = req.body;
    if (!titlu || !descriere || !pret || !categorie) {
      return res.status(400).json({ error: "Toate câmpurile sunt obligatorii" });
    }

    const anunt = new Anunt({
      titlu,
      descriere,
      pret,
      categorie,
      imagini: [],
      userId: req.user.id,
    });

    await anunt.save();
    res.json(anunt);
  } catch (err) {
    console.error("❌ Eroare la salvarea anunțului:", err.message);
    res.status(500).json({ error: "Eroare server" });
  }
});

// ✅ Listare anunțuri (public)
app.get("/api/anunturi", async (req, res) => {
  try {
    const anunturi = await Anunt.find().sort({ createdAt: -1 });
    res.json(anunturi);
  } catch (err) {
    console.error("❌ Eroare la listare anunțuri:", err.message);
    res.status(500).json({ error: "Eroare server" });
  }
});

// =======================
// PORNIRE SERVER
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server Imobilia Market pornit pe portul ${PORT}`)
);
