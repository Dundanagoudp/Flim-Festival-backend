// src/models/contactUsModel.js
import mongoose from "mongoose";

const contactUsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid email"],
    },
    phone: { type: String, required: true, trim: true },
    subject: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// helpful index; removed unique on email
contactUsSchema.index({ email: 1, createdAt: -1 });

const ContactUs = mongoose.model("ContactUs", contactUsSchema);
export default ContactUs;
