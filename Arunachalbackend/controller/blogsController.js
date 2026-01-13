import { Blog, BlogCategory } from "../models/blogsModel.js";

import multer from "multer";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

const handleUpload = (req, res) => new Promise((resolve, reject) => {
  if (req.is && req.is("multipart/form-data")) {
    upload(req, res, (err) => err ? reject(err) : resolve());
  } else { resolve(); }
});

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });
    const exists = await BlogCategory.findOne({ name });
    if (exists) return res.status(400).json({ message: "Category already exists" });
    const cat = await BlogCategory.create({ name });
    res.status(201).json(cat);
  } catch (err) {
    console.error("Create blog category error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getCategories = async (_req, res) => {
  try {
    const cats = await BlogCategory.find().sort({ name: 1 });
    res.status(200).json(cats);
  } catch (err) {
    console.error("Get blog categories error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const cat = await BlogCategory.findById(id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    if (name) {
      const exists = await BlogCategory.findOne({ name });
      if (exists && String(exists._id) !== String(id)) return res.status(400).json({ message: "Category already exists" });
      cat.name = name;
    }
    await cat.save();
    res.status(200).json(cat);
  } catch (err) {
    console.error("Update blog category error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await Blog.countDocuments({ category: id });
    if (inUse > 0) return res.status(400).json({ message: "Category in use by blogs" });
    await BlogCategory.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    console.error("Delete blog category error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createBlog = async (req, res) => {
  try {
    await handleUpload(req, res);
    const { title, contentType, publishedDate, contents, link, category, author } = req.body;
    if (!title || !contentType || !category) return res.status(400).json({ message: "title, contentType, category are required" });
    const cat = await BlogCategory.findById(category);
    if (!cat) return res.status(400).json({ message: "Invalid category" });

    let imageUrl;
    if (req.file && req.file.buffer) {
      imageUrl = await saveBufferToLocal(req.file, "blogs");
     
    }

    if (contentType === "link" && !link) return res.status(400).json({ message: "link is required for link type" });
    if (contentType === "blog" && !contents) return res.status(400).json({ message: "contents is required for blog type" });

    const doc = await Blog.create({ title, contentType, publishedDate, contents, link, category, author, imageUrl });
    res.status(201).json(doc);
  } catch (err) {
    console.error("Create blog error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getBlogs = async (req, res) => {
  try {
    const { category, latest, contentType } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (contentType === "blog" || contentType === "link") filter.contentType = contentType;
    let query = Blog.find(filter).populate("category", "name").sort({ publishedDate: -1, createdAt: -1 });
    if (latest) query = query.limit(parseInt(latest));
    const items = await query.exec();
    res.status(200).json(items);
  } catch (err) {
    console.error("Get blogs error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Blog.findById(id).populate("category", "name");
    if (!doc) return res.status(404).json({ message: "Blog not found" });
    res.status(200).json(doc);
  } catch (err) {
    console.error("Get blog by id error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    await handleUpload(req, res);
    const { id } = req.params;
    const existing = await Blog.findById(id);
    if (!existing) return res.status(404).json({ message: "Blog not found" });

    if (req.body.category) {
      const cat = await BlogCategory.findById(req.body.category);
      if (!cat) return res.status(400).json({ message: "Invalid category" });
    }

    let imageUrl = existing.imageUrl;
    if (req.file && req.file.buffer) {
      // delete old
      if (imageUrl) {
        await deleteLocalByUrl(imageUrl);
      }
      imageUrl = await saveBufferToLocal(req.file, "blogs");
    }

    const updated = await Blog.findByIdAndUpdate(id, { ...req.body, imageUrl }, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    console.error("Update blog error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Blog.findById(id);
    if (!existing) return res.status(404).json({ message: "Blog not found" });
    if (existing.imageUrl) {
      await deleteLocalByUrl(existing.imageUrl);
    }
    await Blog.findByIdAndDelete(id);
    res.status(200).json({ message: "Blog deleted" });
  } catch (err) {
    console.error("Delete blog error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getLatest = async (_req, res) => {
  try {
    const items = await Blog.find()
      .sort({ publishedDate: -1 })
      .limit(5)
      .populate("category", "name")
      .select("-__v"); // Exclude only version field, include all other fields
    
    res.status(200).json(items);
  } catch (err) {
    console.error("Get latest blogs error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Separate functions for blog posts only (GET only)
export const getBlogPostsOnly = async (req, res) => {
  try {
    const { category, latest } = req.query;
    const filter = { contentType: "blog" };
    if (category) filter.category = category;
    
    let query = Blog.find(filter).populate("category", "name").sort({ publishedDate: -1, createdAt: -1 });
    if (latest) query = query.limit(parseInt(latest));
    
    const items = await query.exec();
    res.status(200).json(items);
  } catch (err) {
    console.error("Get blog posts only error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Separate functions for link posts only (GET only)
export const getLinkPostsOnly = async (req, res) => {
  try {
    const { category, latest } = req.query;
    const filter = { contentType: "link" };
    if (category) filter.category = category;
    
    let query = Blog.find(filter).populate("category", "name").sort({ publishedDate: -1, createdAt: -1 });
    if (latest) query = query.limit(parseInt(latest));
    
    const items = await query.exec();
    res.status(200).json(items);
  } catch (err) {
    console.error("Get link posts only error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


