import mongoose from "mongoose";

const EventsCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: Number,
  createdAt: Date,
  updatedAt: Date,
  location: String,
  image: String,
});

EventsCollectionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const EventsCollection = mongoose.model(
  "EventsCollectionV1",
  EventsCollectionSchema
);

const EventDayCollectionSchema = new mongoose.Schema({
  event_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventsCollectionV1",
  },
  dayNumber: Number,
  name: String,
  description: String,
  image: String,
  createdAt: Date,
  updatedAt: Date,
});

const EventDayCollection = mongoose.model(
  "EventDayCollectionV1",
  EventDayCollectionSchema
);

const TimeCollectionSchema = new mongoose.Schema({
  event_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventsCollectionV1",
  },
  day_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventDayCollectionV1",
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  title: String,
  description: String,
  type: {
    type: String,
    enum: ["event", "break"],
    default: "event",
  },
  location: String,
  createdAt: Date,
  updatedAt: Date,
});

const TimeCollection = mongoose.model("TimeCollectionV1", TimeCollectionSchema);

const eventBroucherSchema = new mongoose.Schema({
  event_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventsCollectionV1",
  },
  pdf_url: {
    type: String,
    required: true,
  },
  createdAt: Date,
  updatedAt: Date,
});

const EventBroucher = mongoose.model("EventBroucherV1", eventBroucherSchema);

export { EventsCollection, EventDayCollection, TimeCollection, EventBroucher };


