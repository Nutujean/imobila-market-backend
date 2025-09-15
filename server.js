import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());

// ================== DB CONNECTION ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB"))
  .catch((err) => console.error("❌ Eroare conectare MongoDB:", err));

// ================== MODELE ==================
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const adSchema = new mongoose.Schema({
  titlu: String,
  descriere: String,
  pret: Number,
  status: { type: String, default: "disponibil" },
  imagini: [String],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const User = mongoose.model("User", userSchema);
const Ad = mongoose.model("Ad", adSchema);

// ================== CLOUDINARY ==================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "imobilia-market",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// ================== AUTENTIFICARE ==================

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email deja folosit" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();

    res.status(201).json({ message: "Utilizator creat cu succes" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilizator inexistent" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Parola greșită" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware pentru verificare token
function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ message: "Token lipsă" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token invalid" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token expirat sau invalid" });
    req.userId = decoded.userId;
    next();
  });
}

// ================== RUTE ANUNȚURI ==================

// Get toate anunțurile
app.get("/api/ads", async (req, res) => {
  const ads = await Ad.find().populate("user", "email");
  res.json(ads);
});

// Get un anunț după ID
app.get("/api/ads/:id", async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate("user", "email");
    if (!ad) return res.status(404).json({ message: "Anunț inexistent" });
    res.json(ad);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Adaugă anunț (cu poze)
app.post("/api/ads", auth, upload.array("imagini", 10), async (req, res) => {
  try {
    const urls = req.files ? req.files.map((f) => f.path) : [];
    const ad = new Ad({
      titlu: req.body.titlu,
      descriere: req.body.descriere,
      pret: req.body.pret,
      imagini: urls,
      user: req.userId,
    });
    await ad.save();
    res.status(201).json(ad);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Anunțurile utilizatorului logat
app.get("/api/my-ads", auth, async (req, res) => {
  const ads = await Ad.find({ user: req.userId }).populate("user", "email");
  res.json(ads);
});

// Șterge un anunț
app.delete("/api/ads/:id", auth, async (req, res) => {
  try {
    const ad = await Ad.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!ad) return res.status(404).json({ message: "Anunț inexistent sau nu ai dreptul să-l ștergi" });
    res.json({ message: "Anunț șters cu succes" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================== TEST RUTA ==================
app.get("/", (req, res) => {
  res.send("✅ Backend Imobilia Market funcționează corect!");
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server pornit pe portul ${PORT}`);
});
