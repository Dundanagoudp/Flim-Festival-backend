import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { createCategory, getCategories, updateCategory, deleteCategory, createBlog, getBlogs, getBlogById, updateBlog, deleteBlog, getLatest, getBlogPostsOnly, getLinkPostsOnly } from "../controller/BlogsController.js";

const router = express.Router();

// Categories
router.post("/categoryCreate", protect, restrictTo("admin"), createCategory);
router.get("/getallcategory", getCategories);
router.put("/updatecategory/:id", protect, restrictTo("admin"), updateCategory);
router.delete("/deletecategory/:id", protect, restrictTo("admin"), deleteCategory);

// Blogs (single create, update, delete; list)
router.post("/createblog", protect, restrictTo("admin"), createBlog);
router.get("/getallblogs", getBlogs);
router.get("/getlatest", getLatest);
router.get("/:id", getBlogById);
router.put("/:id", protect, restrictTo("admin"), updateBlog);
router.delete("/:id", protect, restrictTo("admin"), deleteBlog);

// Separate read endpoints for tabs
router.get("/posts", getBlogPostsOnly);
router.get("/links", getLinkPostsOnly);

export default router;


