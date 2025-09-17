import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";   // ✅ corect, folosim bcryptjs
import jwt from "jsonwebtoken";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://imobilia-market.netlify.app"], // 🔑 ajustează dacă ai alt domeniu frontend
    credentials: true,
  })
);

// 📌 Conectare MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectat la MongoDB Atlas"))
  .catch((err) => console.error("❌ Eroare MongoDB:", err));

// 📌 Configurare Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📌 Storage pentru imagini
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "imobilia-market",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});
const upload = multer({ storage });

// 📌 MODELE
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
  imagine: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
const Anunt = mongoose.model("Anunt", anuntSchema);

// 📌 Middleware autentificare
function autentificare(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Token lipsă" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Token invalid" });
  }
}

// 📌 REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { email, parola } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(parola, 10);
    const newUser = new User({ email, parola: hashedPassword });
    await newUser.save();
    res.json({ message: "Utilizator creat cu succes" });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// 📌 LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, parola } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(parola, user.parola);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch {
    res.status(500).json({ error: "Eroare server" });
  }
});

// 📌 Creare anunț
app.post("/api/anunturi", autentificare, upload.single("imagine"), async (req, res) => {
  try {
    const { titlu, descriere, pret, categorie } = req.body;
    const imagine = req.file ? req.file.path : null;
    const anunt = new Anunt({
      titlu,
      descriere,
      pret,
      categorie,
      imagine,
      userId: req.userId,
    });
    await anunt.save();
    res.json(anunt);
  } catch {
    res.status(500).json({ error: "Eroare la crearea anunțului" });
  }
});

// 📌 Listare toate anunțurile
app.get("/api/anunturi", async (req, res) => {
  const anunturi = await Anunt.find();
  res.json(anunturi);
});

// 📌 Listare anunțurile user-ului logat
app.get("/api/anunturile-mele", autentificare, async (req, res) => {
  const anunturi = await Anunt.find({ userId: req.userId });
  res.json(anunturi);
});

// 📌 Ștergere anunț
app.delete("/api/anunturi/:id", autentificare, async (req, res) => {
  try {
    await Anunt.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Anunț șters" });
  } catch {
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

// 📌 Editare anunț
app.put("/api/anunturi/:id", autentificare, upload.single("imagine"), async (req, res) => {
  try {
    const { titlu, descriere, pret, categorie } = req.body;
    const imagine = req.file ? req.file.path : undefined;
    const updateData = { titlu, descriere, pret, categorie };
    if (imagine) updateData.imagine = imagine;

    const anunt = await Anunt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    );
    res.json(anunt);
  } catch {
    res.status(500).json({ error: "Eroare la editare" });
  }
});

// 📌 Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend Imobilia Market funcțional 🚀" });
});

// 📌 Pornire server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server Imobilia Market pornit pe portul ${PORT}`));
