import mongoose from "mongoose";

const WorkshopSchema = new mongoose.Schema(
  {
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkshopCategory",
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    about: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v),
        message: "Invalid image URL format",
      },
    },
    registrationFormUrl: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /(^https:\/\/docs\.google\.com\/forms\/.+)|(^https:\/\/forms\.gle\/.+)/i.test(v),
        message: "Must be a valid Google Form URL",
      },
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const Workshop = mongoose.model("Workshop", WorkshopSchema);
export default Workshop;
