import { Router } from "express";

import {
    createHomepage,
    getAllHomepages,
    getHomepage,
    updateHomepage,
    deleteHomepage,
  } from "../controller/HomepageController.js";

import {protect,restrictTo} from "../utils/auth.js";

const router = Router();

router.post("/",protect,restrictTo("admin"), createHomepage);
router.get("/", getAllHomepages);
router.get("/:id", getHomepage);
router.put("/:id",protect,restrictTo("admin"),  updateHomepage);
router.delete("/:id", protect,restrictTo("admin"), deleteHomepage);

export default router;