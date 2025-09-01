import mongoose from "mongoose";

const blogCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

const blogSchema = new mongoose.Schema({
  category: {
     type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
       required: true
     },
  title: { 
    type: String,
     required: true,
      trim: true
     },
  author: {
     type: String,
      default: "Arunachal Flim Festival" 
    },
  imageUrl: { 
    type: String
 },
  contentType: { 
    type: String,
     enum: ["link", "blog"], 
     required: true
     },
  link: { 
    type: String
 },
  contents: { 
    type: String
 },
  publishedDate: { 
    type: Date, 
    default: Date.now
 },
}, { timestamps: true });

const BlogCategory = mongoose.model("BlogCategory", blogCategorySchema);
const Blog = mongoose.model("Blog", blogSchema);

export { Blog, BlogCategory };




