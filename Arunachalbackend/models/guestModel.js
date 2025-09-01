import mongoose from "mongoose";

const guestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 0,
    max: 120
  },
  description: {
    type: String,
    trim: true
  },
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year',
    required: true
  },
  movies: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for better query performance
guestSchema.index({ year: 1, role: 1 });
guestSchema.index({ name: 1 });

const Guest = mongoose.model('Guest', guestSchema);

export default Guest;
