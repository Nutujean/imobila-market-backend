import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, enum: ["vanzare", "inchiriere"], required: true },
    images: [{ type: String }], // link-urile imaginilor Cloudinary
  },
  { timestamps: true }
);

export default mongoose.model("Listing", listingSchema);
