import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    location: String,
    type: {
      type: String,
      enum: ["Apartament", "Garsoniera", "Casa", "Teren", "Garaj", "Altul"],
      default: "Apartament",
    },
    rooms: { type: Number, default: 0 },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Listing = mongoose.model("Listing", ListingSchema);
