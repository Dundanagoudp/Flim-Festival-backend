import mongoose from "mongoose";

const yearSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    unique: true,
    min: 1900,
    max: 2100
  },
  active: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Year = mongoose.model('Year', yearSchema);

export default Year;
