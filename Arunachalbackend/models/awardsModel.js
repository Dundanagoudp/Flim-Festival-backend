import mongoose from "mongoose";

const awardSchema = new mongoose.Schema({
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
});

const Award = mongoose.model("Award", awardSchema);

export default Award;
