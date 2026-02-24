import mongoose from "mongoose";

const galleryDaySchema = new mongoose.Schema({
  year: { type: mongoose.Schema.Types.ObjectId, ref: "GalleryYear", required: true },
  name: { type: String, trim: true, required: true },
  date: { type: Date },
  order: { type: Number, default: 0 }
}, { timestamps: true });

galleryDaySchema.index({ year: 1, order: 1 });

const GalleryDay = mongoose.model("GalleryDay", galleryDaySchema);
export default GalleryDay;
