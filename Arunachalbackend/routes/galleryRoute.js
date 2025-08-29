import express from "express";
import { addGalleryImage, getGalleryGroupedByYear, getGalleryByYear, deleteGalleryImage, bulkDeleteImages, createYear, updateYear, deleteYear, getYears } from "../controller/galleryController.js";
import { protect, restrictTo } from "../utils/auth.js";

const router = express.Router();

router.post("/addimages", protect, restrictTo("admin"), addGalleryImage);
router.get("/gallery-yearwise", getGalleryGroupedByYear);
router.get("/getallgallery", getGalleryByYear); 
router.delete("/deletegallery/:id", protect, restrictTo("admin"), deleteGalleryImage);
router.delete("/bulkdeleteimages", protect, restrictTo("admin"), bulkDeleteImages);
router.post("/gallerycreateYear", protect, restrictTo("admin"), createYear);
router.put("/updateyear/:id", protect, restrictTo("admin"), updateYear);
router.delete("/deleteyear/:id", protect, restrictTo("admin"), deleteYear);
router.get("/getallyear", getYears);

export default router;


