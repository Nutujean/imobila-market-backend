import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() =, err.message));

app.get("/api/test",(req,res)=;});

app.listen(PORT,()= Server oltenitaimobiliare pornit pe portul ${PORT}`));
