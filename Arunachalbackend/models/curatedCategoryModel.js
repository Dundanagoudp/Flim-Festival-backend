// models/curatedCategoryModel.js
import mongoose from "mongoose";

const curatedCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, default: "", trim: true },
    public: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CuratedCategory =
  mongoose.models.CuratedCategory ||
  mongoose.model("CuratedCategory", curatedCategorySchema);

export default CuratedCategory;
