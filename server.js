import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// ===== Conectare MongoDB =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB Atlas"))
  .catch((err) => console.error("❌ Mongo error:", err.message));

// ===== MODELE =====
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  parola: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const anuntSchema = new mongoose.Schema({
  titlu: String,
  descriere: String,
  pret: Number,
  categorie: String,
  imagini: [String],
  userId: String,
  createdAt: { type: Date, default: Date.now },
});
const Anunt = mongoose.model("Anunt", anuntSchema);

// ===== Middleware auth =====
const authMiddleware = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "Lipsă token" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token invalid" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalid" });
  }
};

// ===== Upload imagini =====
const upload = multer({ dest: "uploads/" });

// ===== RUTE =====
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funcționează corect 🚀" });
});

app.post("/api/register", async (req, res) => {
  try {
    const { email, parola } = req.body;
    const hashed = await bcrypt.hash(parola, 10);
    const user = new User({ email, parola: hashed });
    await user.save();
    res.json({ message: "User creat cu succes" });
  } catch {
    res.status(400).json({ error: "Eroare la înregistrare" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, parola } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User inexistent" });

    const match = await bcrypt.compare(parola, user.parola);
    if (!match) return res.status(400).json({ error: "Parola greșită" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch {
    res.status(500).json({ error: "Eroare server la login" });
  }
});

app.post(
  "/api/anunturi",
  authMiddleware,
  upload.array("imagini", 10),
  async (req, res) => {
    try {
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
    } catch {
      res.status(500).json({ error: "Eroare server la salvarea anunțului" });
    }
  }
);

app.get("/api/anunturi", async (req, res) => {
  const anunturi = await Anunt.find().sort({ createdAt: -1 });
  res.json(anunturi);
});

app.delete("/api/anunturi/:id", authMiddleware, async (req, res) => {
  try {
    const anunt = await Anunt.findById(req.params.id);
    if (!anunt) return res.status(404).json({ error: "Anunț inexistent" });
    if (anunt.userId !== req.user.id)
      return res.status(403).json({ error: "Nu ai voie să ștergi acest anunț" });

    await anunt.deleteOne();
    res.json({ message: "Anunț șters cu succes" });
  } catch {
    res.status(500).json({ error: "Eroare server la ștergere" });
  }
});

// ===== Pornire server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server oltenitaimobiliare pornit pe portul ${PORT}`)
);
