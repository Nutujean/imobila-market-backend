import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// 📂 Upload local imagini (deocamdată stocăm în /uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 🔑 Middleware autentificare JWT
const auth = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Acces interzis" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch {
    res.status(400).json({ error: "Token invalid" });
  }
};

// 📌 MongoDB Models
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  parola: String,
});
const User = mongoose.model("User", userSchema);

const anuntSchema = new mongoose.Schema({
  titlu: String,
  descriere: String,
  pret: Number,
  categorie: String,
  imagine: String,
  userId: String,
});
const Anunt = mongoose.model("Anunt", anuntSchema);

// 🔑 Register
app.post("/api/register", async (req, res) => {
  try {
    const { email, parola } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(parola, 10);
    const user = new User({ email, parola: hashed });
    await user.save();

    res.json({ message: "Utilizator creat cu succes" });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// 🔑 Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, parola } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(parola, user.parola);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// ➕ Creare anunț
app.post("/api/anunturi", auth, upload.single("imagine"), async (req, res) => {
  try {
    const { titlu, descriere, pret, categorie } = req.body;
    const imagine = req.file ? `/uploads/${req.file.filename}` : null;

    const anunt = new Anunt({
      titlu,
      descriere,
      pret,
      categorie,
      imagine,
      userId: req.user,
    });

    await anunt.save();
    res.json(anunt);
  } catch (err) {
    res.status(500).json({ error: "Eroare la crearea anunțului" });
  }
});

// 📋 Toate anunțurile
app.get("/api/anunturi", async (req, res) => {
  try {
    const anunturi = await Anunt.find();
    res.json(anunturi);
  } catch {
    res.status(500).json({ error: "Eroare la încărcarea anunțurilor" });
  }
});

// 🔍 Detalii anunț
app.get("/api/anunturi/:id", async (req, res) => {
  try {
    const anunt = await Anunt.findById(req.params.id);
    if (!anunt) return res.status(404).json({ error: "Anunțul nu există" });
    res.json(anunt);
  } catch {
    res.status(500).json({ error: "Eroare server" });
  }
});

// 👤 Anunțurile utilizatorului logat
app.get("/api/anunturile-mele", auth, async (req, res) => {
  try {
    const anunturi = await Anunt.find({ userId: req.user });
    res.json(anunturi);
  } catch {
    res.status(500).json({ error: "Eroare la încărcarea anunțurilor" });
  }
});

// ✏️ Editare anunț
app.put("/api/anunturi/:id", auth, upload.single("imagine"), async (req, res) => {
  try {
    const { titlu, descriere, pret, categorie } = req.body;
    const updateData = { titlu, descriere, pret, categorie };

    if (req.file) {
      updateData.imagine = `/uploads/${req.file.filename}`;
    }

    const anunt = await Anunt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      updateData,
      { new: true }
    );

    if (!anunt) return res.status(404).json({ error: "Anunțul nu există" });

    res.json(anunt);
  } catch {
    res.status(500).json({ error: "Eroare la editarea anunțului" });
  }
});

// 🗑️ Ștergere anunț
app.delete("/api/anunturi/:id", auth, async (req, res) => {
  try {
    const anunt = await Anunt.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    });

    if (!anunt) return res.status(404).json({ error: "Anunțul nu există" });

    res.json({ message: "Anunț șters cu succes" });
  } catch {
    res.status(500).json({ error: "Eroare la ștergerea anunțului" });
  }
});

// 📌 MongoDB Connect
const PORT = process.env.PORT || 10000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ Server Imobilia Market pornit pe portul ${PORT}`)
    );
  })
  .catch((err) => console.error("❌ Eroare conectare MongoDB:", err));
