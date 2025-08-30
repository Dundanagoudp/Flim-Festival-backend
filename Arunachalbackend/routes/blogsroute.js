import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { 
  createCategory, 
  getCategories, 
  updateCategory, 
  deleteCategory, 
  createBlog, 
  getBlogs, 
  getBlogById, 
  updateBlog, 
  deleteBlog, 
  getLatest, 
  getBlogPostsOnly, 
  getLinkPostsOnly
} from "../controller/blogsController.js";

const router = express.Router();

// Categories
router.post("/categoryCreate", protect, restrictTo("admin"), createCategory);
router.get("/getallcategory", getCategories);
router.put("/updatecategory/:id", protect, restrictTo("admin"), updateCategory);
router.delete("/deletecategory/:id", protect, restrictTo("admin"), deleteCategory);

// General blog operations (single create, update, delete; list)
router.post("/createblog", protect, restrictTo("admin"), createBlog);
router.get("/getallblogs", getBlogs);
router.get("/getlatest", getLatest);
router.get("/singleblog/:id", getBlogById);
router.put("/updateblogs/:id", protect, restrictTo("admin"), updateBlog);
router.delete("/deleteblog/:id", protect, restrictTo("admin"), deleteBlog);

// Separate read endpoints for different blog types (GET only)
router.get("/contentblogs/posts", getBlogPostsOnly);
router.get("/linkblogs/posts", getLinkPostsOnly);

export default router;


