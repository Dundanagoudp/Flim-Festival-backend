// routes/HomepageRoutes.js
import { Router } from "express";
import {
  createHomepage,
  getAllHomepages,
  getHomepage,
  updateHomepage,
  deleteHomepage,
} from "../controller/HomepageController.js"; // (note plural controllers)

import { protect, restrictTo } from "../utils/auth.js";
import upload from "../utils/multerMemory.js";

const router = Router();

router.post(
  "/",
  protect,
  restrictTo("admin"),
  upload.single("video"),
  createHomepage
);

router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  upload.single("video"),
  updateHomepage
);

router.get("/", getAllHomepages);
router.get("/:id", getHomepage);

router.delete("/:id", protect, restrictTo("admin"), deleteHomepage);

export default router;
