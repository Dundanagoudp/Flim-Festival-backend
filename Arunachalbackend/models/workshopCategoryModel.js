import mongoose from "mongoose";

const workshopCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

workshopCategorySchema.index({ order: 1 });

const WorkshopCategory = mongoose.model("WorkshopCategory", workshopCategorySchema);
export default WorkshopCategory;
