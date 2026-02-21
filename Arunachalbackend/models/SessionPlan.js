import mongoose from "mongoose";

const toJSONWithId = {
  transform(doc, ret) {
    ret.id = ret._id;
    return ret;
  },
};

const slotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    director: { type: String },
    moderator: { type: String },
    duration: { type: String },
    category: { type: String, default: "Film" },
    description: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: toJSONWithId }
);

const screenSchema = new mongoose.Schema(
  {
    screenName: { type: String, required: true },
    slots: { type: [slotSchema], default: [] },
  },
  { timestamps: true, toJSON: toJSONWithId }
);

const daySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    date: { type: String, required: true },
    pdfUrl: { type: String, default: "" },
    screens: { type: [screenSchema], default: [] },
  },
  { timestamps: true, toJSON: toJSONWithId }
);

const sessionPlanSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    festival: { type: String, required: true },
    isVisible: { type: Boolean, default: false },
    pdfUrl: { type: String, default: "" },
    days: { type: [daySchema], default: [] },
  },
  { timestamps: true, toJSON: toJSONWithId }
);

const SessionPlan =
  mongoose.models.SessionPlan ||
  mongoose.model("SessionPlan", sessionPlanSchema);

export default SessionPlan;
