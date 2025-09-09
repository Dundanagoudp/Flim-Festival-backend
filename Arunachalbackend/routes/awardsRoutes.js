import express from "express";
import {
  createAwards,
  getAllAwards,
  getAwardsById,
  updateAwards,
  deleteAwards,
  createAwardCategory,
  getAllAwardCategories,
  updateAwardCategory,
  deleteAwardCategory
} from "../controller/awardsController.js";
import {restrictTo, protect} from "../utils/auth.js";

import upload from "../utils/multerMemory.js";
const router = express.Router();

// Category management routes
router.post("/categoryCreate", protect, restrictTo("admin"), createAwardCategory);
router.get("/getAllCategories", getAllAwardCategories);
router.put("/updateCategory/:id", protect, restrictTo("admin", "editor"), updateAwardCategory);
router.delete("/deleteCategory/:id", protect, restrictTo("admin"), deleteAwardCategory);

// Award management routes
router.post("/createAwards", protect, restrictTo("admin"), upload.fields([
    { name: "image", maxCount: 1 },
    { name: "array_images", maxCount: 10 },
  ]), createAwards);
router.get("/getAllAwards", getAllAwards);
router.get("/getAwardsById/:id", getAwardsById);
router.put("/updateAwards/:id", protect,restrictTo("admin", "editor"), upload.fields([
    { name: "image", maxCount: 1 },
    { name: "array_images", maxCount: 10 },
  ]), updateAwards);
router.delete("/deleteAwards/:id", protect, restrictTo("admin"), deleteAwards);

export default router;