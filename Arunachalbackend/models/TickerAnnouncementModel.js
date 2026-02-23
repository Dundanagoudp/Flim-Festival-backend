import mongoose from "mongoose";

const tickerAnnouncementSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const TickerAnnouncement =
  mongoose.models.TickerAnnouncement ||
  mongoose.model("TickerAnnouncement", tickerAnnouncementSchema);

export default TickerAnnouncement;
