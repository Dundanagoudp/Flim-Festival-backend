import express from "express";
import { addGalleryImage, getGalleryGroupedByYear, getGalleryByYear, deleteGalleryImage, bulkDeleteImages, createYear, updateYear, deleteYear, getYears, getDaysByYear, createDay, updateDay, deleteDay } from "../controller/galleryController.js";
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

// Day CRUD (under year)
router.get("/getdaysbyyear", getDaysByYear);
router.post("/gallerycreateDay", protect, restrictTo("admin"), createDay);
router.put("/updateday/:id", protect, restrictTo("admin"), updateDay);
router.delete("/deleteday/:id", protect, restrictTo("admin"), deleteDay);

export default router;


