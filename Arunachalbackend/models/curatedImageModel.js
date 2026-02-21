// models/curatedImageModel.js
import mongoose from "mongoose";

const curatedImageSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CuratedCategory",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
    jury_name: { type: String, default: "", trim: true },
    designation: { type: String, default: "", trim: true },
    short_bio: { type: String, default: "", trim: true },
    full_biography: { type: String, default: "", trim: true },
    film_synopsis: { type: String, default: "", trim: true },
    display_order: { type: Number, default: 0 },
    status: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

curatedImageSchema.index({ category: 1, display_order: 1 });
curatedImageSchema.index({ category: 1, order: 1 });

const CuratedImage =
  mongoose.models.CuratedImage ||
  mongoose.model("CuratedImage", curatedImageSchema);

export default CuratedImage;
