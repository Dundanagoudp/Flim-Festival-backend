import mongoose from "mongoose";

const slotCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        return ret;
      },
    },
  }
);

const SlotCategory =
  mongoose.models.SlotCategory ||
  mongoose.model("SlotCategory", slotCategorySchema);

export default SlotCategory;
