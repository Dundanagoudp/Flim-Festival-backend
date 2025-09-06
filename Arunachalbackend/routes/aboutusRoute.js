import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import upload from "../utils/multerMemory.js";
import {
    getAboutUsBanner,
    getAboutUsStatistics,
    getAboutUsLookInside,
    createOrUpdateBanner,
    createOrUpdateStatistics,
    createOrUpdateLookInside,
    deleteAboutUsBanner,
    deleteAboutUsStatistics,
    deleteAboutUsLookInside,
    deleteAboutUsBannerById,
    deleteAboutUsStatisticsById,
    deleteAboutUsLookInsideById,
    updateAboutUsBannerById,
    updateAboutUsStatisticsById,
    updateAboutUsLookInsideById
} from "../controller/aboutuController.js";

const aboutUsRoute = express.Router();

// Section-specific public routes
aboutUsRoute.get("/banner", getAboutUsBanner);
aboutUsRoute.get("/statistics", getAboutUsStatistics);
aboutUsRoute.get("/introduction", getAboutUsLookInside);

// Section-specific admin routes
aboutUsRoute.post("/banner", protect, restrictTo("admin"), upload.single('backgroundImage'), createOrUpdateBanner);
aboutUsRoute.put("/banner", protect, restrictTo("admin"), upload.single('backgroundImage'), createOrUpdateBanner);
aboutUsRoute.put("/banner/:id", protect, restrictTo("admin"), upload.single('backgroundImage'), updateAboutUsBannerById);
aboutUsRoute.delete("/banner", protect, restrictTo("admin"), deleteAboutUsBanner);
aboutUsRoute.delete("/banner/:id", protect, restrictTo("admin"), deleteAboutUsBannerById);
// Make statistics public and allow optional image upload via 'image'
aboutUsRoute.post("/statistics", upload.single('image'), createOrUpdateStatistics);
aboutUsRoute.put("/statistics", upload.single('image'), createOrUpdateStatistics);
aboutUsRoute.put("/statistics/:id", upload.single('image'), updateAboutUsStatisticsById);
aboutUsRoute.delete("/statistics", deleteAboutUsStatistics);
aboutUsRoute.delete("/statistics/:id", deleteAboutUsStatisticsById);

// Look Inside routes
aboutUsRoute.post("/introduction", protect, restrictTo("admin"), upload.single('image'), createOrUpdateLookInside);
aboutUsRoute.put("/introduction", protect, restrictTo("admin"), upload.single('image'), createOrUpdateLookInside);
aboutUsRoute.put("/introduction/:id", protect, restrictTo("admin"), upload.single('image'), updateAboutUsLookInsideById);
aboutUsRoute.delete("/introduction", protect, restrictTo("admin"), deleteAboutUsLookInside);
aboutUsRoute.delete("/introduction/:id", protect, restrictTo("admin"), deleteAboutUsLookInsideById);

export default aboutUsRoute;
