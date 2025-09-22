import mongoose from "mongoose";

const anuntSchema = new mongoose.Schema(
  {
    titlu: {
      type: String,
      required: true,
    },
    descriere: {
      type: String,
      required: true,
    },
    pret: {
      type: Number,
      required: true,
    },
    categorie: {
      type: String,
      required: true,
      enum: [
        "Apartamente",
        "Case",
        "Terenuri",
        "Garsoniere",
        "Garaje",
        "Spațiu comercial",
      ],
    },
    imagini: {
      type: [String], // array de URL-uri sau path-uri
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Anunt", anuntSchema);
