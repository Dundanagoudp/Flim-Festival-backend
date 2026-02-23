import mongoose from "mongoose";

const heroBannerSchema = new mongoose.Schema(
  {
    video: { type: String, default: "" },
    title: { type: String, default: "", trim: true },
    subtitle: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const HeroBanner =
  mongoose.models.HeroBanner ||
  mongoose.model("HeroBanner", heroBannerSchema);

export default HeroBanner;
