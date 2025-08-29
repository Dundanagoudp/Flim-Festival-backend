import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { createCategory, getCategories, updateCategory, deleteCategory, createBlog, getBlogs, getBlogById, updateBlog, deleteBlog, getLatest, getBlogPostsOnly, getLinkPostsOnly } from "../controller/BlogsController.js";

const router = express.Router();

// Categories
router.post("/category", protect, restrictTo("admin"), createCategory);
router.get("/category", getCategories);
router.put("/category/:id", protect, restrictTo("admin"), updateCategory);
router.delete("/category/:id", protect, restrictTo("admin"), deleteCategory);

// Blogs (single create, update, delete; list)
router.post("/", protect, restrictTo("admin"), createBlog);
router.get("/", getBlogs);
router.get("/latest", getLatest);
router.get("/:id", getBlogById);
router.put("/:id", protect, restrictTo("admin"), updateBlog);
router.delete("/:id", protect, restrictTo("admin"), deleteBlog);

// Separate read endpoints for tabs
router.get("/posts", getBlogPostsOnly);
router.get("/links", getLinkPostsOnly);

export default router;


