import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// --- Ruta de test ---
app.get("/api/test", (req, res) => {
  res.json({ message: "Codul nou rulează pe Render ✅" });
});

// --- Conectare MongoDB Atlas ---
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conectat la MongoDB"))
  .catch((err) => console.error("❌ Eroare conectare MongoDB:", err));

// --- Modele ---
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", userSchema);

const anuntSchema = new mongoose.Schema(
  {
    titlu: String,
    descriere: String,
    pret: Number,
    categorie: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Anunt = mongoose.model("Anunt", anuntSchema);

// --- Middleware autentificare ---
const authMiddleware = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "Lipsă token" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token invalid" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token expirat sau invalid" });
  }
};

// --- Rute autentificare ---
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash });
    await user.save();
    res.json({ message: "Utilizator creat cu succes" });
  } catch (err) {
    res.status(400).json({ error: "Eroare la crearea utilizatorului" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Utilizator inexistent" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Parolă incorectă" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Eroare la autentificare" });
  }
});

// --- Rute anunțuri ---
app.post("/api/anunturi", authMiddleware, async (req, res) => {
  try {
    const anunt = new Anunt({
      titlu: req.body.titlu,
      descriere: req.body.descriere,
      pret: req.body.pret,
      categorie: req.body.categorie,
      user: req.user.userId,
    });
    await anunt.save();
    res.json(anunt);
  } catch (err) {
    res.status(500).json({ error: "Eroare la crearea anunțului" });
  }
});

app.get("/api/anunturi", async (req, res) => {
  try {
    const anunturi = await Anunt.find().sort({ createdAt: -1 });
    res.json(anunturi);
  } catch (err) {
    res.status(500).json({ error: "Eroare la listarea anunțurilor" });
  }
});
// --- Ruta pentru un singur anunț ---
app.get("/api/anunturi/:id", async (req, res) => {
  try {
    const anunt = await Anunt.findById(req.params.id).populate("user", "email");
    if (!anunt) {
      return res.status(404).json({ error: "Anunțul nu a fost găsit" });
    }
    res.json(anunt);
  } catch (err) {
    res.status(500).json({ error: "Eroare la preluarea anunțului" });
  }
});


// --- Pornire server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server pornit pe portul ${PORT}`));
