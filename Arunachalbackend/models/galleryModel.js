import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
  caption: { type: String, trim: true },
  year: { type: mongoose.Schema.Types.ObjectId, ref: "GalleryYear", required: true },
  day: { type: mongoose.Schema.Types.ObjectId, ref: "GalleryDay" },
  photo: { type: String, required: true },
}, { timestamps: true });

gallerySchema.index({ year: 1, createdAt: -1 });
gallerySchema.index({ year: 1, day: 1, createdAt: -1 });

const Gallery = mongoose.model("Gallery", gallerySchema);
export default Gallery;


