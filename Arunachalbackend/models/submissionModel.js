import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [/.+@.+\..+/, "Please enter a valid email"],
  },
  phone: {
    type: String,
    required: true,
  },
  videoType: {
    type: String,
    enum: ["Short Film", "Documentary"], 
    required: true,
  },
  videoFile: {
    type: String, // URL or path to video
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  contacted: {
    type: Boolean,
    default: false, // initially not contacted
  }
}, {
  timestamps: true
});

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
