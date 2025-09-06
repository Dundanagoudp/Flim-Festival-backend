// models/Nomination.js
import mongoose from "mongoose";

export const NOMINATION_TYPES = ["short_film", "documentary"];

const nominationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    type: {
      type: String,
      enum: NOMINATION_TYPES,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// If your environment hot-reloads, this avoids OverwriteModelError
const Nomination =
  mongoose.models.Nomination || mongoose.model("Nomination", nominationSchema);

export default Nomination;
