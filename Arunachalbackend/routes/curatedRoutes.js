// routes/curatedRoutes.js
import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getImagesByCategory,
  uploadImage,
  updateImage,
  deleteImage,
  getGroupedImages,
} from "../controller/curatedController.js";
import { protect, restrictTo } from "../utils/auth.js";
import upload from "../utils/multerMemory.js";

const router = Router();

const handleImageUpload = (req, res, next) => {
  if (req.is("multipart/form-data")) {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: "File upload error", error: err.message });
      }
      next();
    });
  } else {
    next();
  }
};

// Categories (admin for write)
router.get("/categories", getCategories);
// POST /category body (JSON): { name (required), slug?, public?, order? }
router.post("/category", protect, restrictTo("admin"), createCategory);
router.put("/category/:id", protect, restrictTo("admin"), updateCategory);
router.delete("/category/:id", protect, restrictTo("admin"), deleteCategory);

// Images: grouped must be before /images so "grouped" is not used as categoryId
router.get("/images/grouped", getGroupedImages);
router.get("/images", getImagesByCategory);
router.post("/image", protect, restrictTo("admin"), handleImageUpload, uploadImage);
router.put("/image/:id", protect, restrictTo("admin"), handleImageUpload, updateImage);
router.delete("/image/:id", protect, restrictTo("admin"), deleteImage);

export default router;
