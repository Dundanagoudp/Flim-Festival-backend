import mongoose from "mongoose";

const timeslotSchema = new mongoose.Schema({
  startTime: {
    type: String, // e.g. "09:00 AM"
    required: true,
  },
  endTime: {
    type: String, // e.g. "10:00 AM"
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const daySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  image: {
    type: String,
    required: true, // one image per day
  },
  timeslots: [timeslotSchema],
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: [daySchema],
  },
  { timestamps: true }
);

// 🔒 Validation: Ensure days are within startDate–endDate
eventSchema.pre("save", function (next) {
  if (this.days && this.days.length > 0) {
    for (let d of this.days) {
      if (d.date < this.startDate || d.date > this.endDate) {
        return next(
          new Error(
            `Day ${d.date.toISOString().split("T")[0]} is outside the allowed range (${this.startDate.toISOString().split("T")[0]} - ${this.endDate.toISOString().split("T")[0]})`
          )
        );
      }
    }
  }
  next();
});

// Also run validation on update
eventSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.days && update.startDate && update.endDate) {
    for (let d of update.days) {
      if (d.date < update.startDate || d.date > update.endDate) {
        return next(
          new Error(
            `Day ${d.date.toISOString().split("T")[0]} is outside the allowed range (${update.startDate.toISOString().split("T")[0]} - ${update.endDate.toISOString().split("T")[0]})`
          )
        );
      }
    }
  }
  next();
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
