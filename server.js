import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Listing from "./models/Listing.js"; // trebuie să existe models/Listing.js

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 🔧 Conectare MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Conectat la MongoDB Atlas"))
  .catch((err) => console.error("❌ Eroare MongoDB:", err));

// 🔧 Configurare Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔧 Configurare Multer + Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "oltenitaimobiliare",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});
const upload = multer({ storage });

// 🔧 Rute
app.get("/", (req, res) => {
  res.send("✅ Backend OltenitaImobiliare funcționează!");
});

// ✅ Adaugă un anunț
app.post("/api/listings", upload.array("images", 10), async (req, res) => {
  try {
    console.log("📥 BODY primit:", req.body);
    console.log("📸 FILES primite:", req.files);

    const listing = new Listing({
      title: req.body.title,
      category: req.body.category,
      location: req.body.location,
      price: req.body.price,
      type: req.body.type,
      images: req.files.map((file) => file.path),
    });

    await listing.save();
    res.json(listing);
  } catch (err) {
    console.error("❌ Eroare la adăugarea anunțului:", err);

    res.status(500).json({
      message: err.message || "Eroare necunoscută",
      stack: err.stack,
    });
  }
});

// ✅ Listează toate anunțurile
app.get("/api/listings", async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    console.error("❌ Eroare la obținerea anunțurilor:", err);
    res.status(500).json({
      message: err.message || "Eroare necunoscută",
      stack: err.stack,
    });
  }
});

// ✅ Pornire server
app.listen(PORT, () => {
  console.log(`✅ Server OltenitaImobiliare pornit pe portul ${PORT}`);
});
