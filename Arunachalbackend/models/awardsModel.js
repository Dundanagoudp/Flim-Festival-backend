import mongoose from "mongoose";

const awardCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

const awardSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AwardCategory",
    required: true
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  array_images: {
    type: [String],
    required: true,
  },
  rule1: {
    type: String,
    required: true,
  },
  rule2: {
    type: String,
    required: true,
  },
  rule3: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const AwardCategory = mongoose.model("AwardCategory", awardCategorySchema);
const Award = mongoose.model("Award", awardSchema);

export { Award, AwardCategory };
