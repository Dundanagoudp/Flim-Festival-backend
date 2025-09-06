import mongoose from "mongoose";

const videoBlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  videoType: {
    type: String,
    enum: ["youtube", "video"],
    required: true,
  },
  youtubeUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        if (!value) return true;
        return (
          /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+$/.test(value) ||
          /^https:\/\/youtu\.be\/[\w-]+$/.test(value)
        );
      },
      message: (props) => `${props.value} is not a valid YouTube URL.`,
    },
  },
  imageUrl: {
    type: String,
  },
  video_url: {
    type: String,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const VideoBlog = mongoose.model("VideoBlog", videoBlogSchema);
export default VideoBlog;


