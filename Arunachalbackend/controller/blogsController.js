import { Blog, BlogCategory } from "../models/blogsModel.js";
import { bucket } from "../config/firebaseConfig.js";
import multer from "multer";

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
      const fileName = `blogs/${Date.now()}-${req.file.originalname}`;
      const fileUpload = bucket.file(fileName);
      await new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });
        stream.on("error", reject);
        stream.on("finish", async () => { try { await fileUpload.makePublic(); resolve(); } catch (e) { reject(e); } });
        stream.end(req.file.buffer);
      });
      imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
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
        const filePath = imageUrl.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
        if (filePath) await bucket.file(filePath).delete().catch(() => {});
      }
      const fileName = `blogs/${Date.now()}-${req.file.originalname}`;
      const fileUpload = bucket.file(fileName);
      await new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });
        stream.on("error", reject);
        stream.on("finish", async () => { try { await fileUpload.makePublic(); resolve(); } catch (e) { reject(e); } });
        stream.end(req.file.buffer);
      });
      imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
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
      const filePath = existing.imageUrl.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
      if (filePath) await bucket.file(filePath).delete().catch(() => {});
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
    const items = await Blog.find().sort({ publishedDate: -1 }).limit(5).select("title publishedDate imageUrl author");
    res.status(200).json(items);
  } catch (err) {
    console.error("Get latest blogs error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Convenience wrappers for separate endpoints
export const createBlogPost = (req, res) => {
  req.body.contentType = "blog";
  return createBlog(req, res);
};

export const createLinkPost = (req, res) => {
  req.body.contentType = "link";
  return createBlog(req, res);
};

export const getBlogPostsOnly = (req, res) => {
  req.query.contentType = "blog";
  return getBlogs(req, res);
};

export const getLinkPostsOnly = (req, res) => {
  req.query.contentType = "link";
  return getBlogs(req, res);
};


