import mongoose from "mongoose";

const galleryYearSchema = new mongoose.Schema({
  value: { type: Number, required: true, unique: true, min: 1900, max: 2100 },
  name: { type: String, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const GalleryYear = mongoose.model("GalleryYear", galleryYearSchema);
export default GalleryYear;



