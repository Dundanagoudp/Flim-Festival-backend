import { Router } from "express";
import { protect, restrictTo } from "../utils/auth.js";
import upload from "../utils/multerMemory.js";
import {
  getCurrent,
  createOrUpdate,
  deleteCurrent,
} from "../controller/heroBannerController.js";

const router = Router();

router.get("/", getCurrent);
router.post(
  "/",
  protect,
  restrictTo("admin"),
  upload.single("video"),
  createOrUpdate
);
router.put(
  "/",
  protect,
  restrictTo("admin"),
  upload.single("video"),
  createOrUpdate
);
router.delete("/", protect, restrictTo("admin"), deleteCurrent);

export default router;
