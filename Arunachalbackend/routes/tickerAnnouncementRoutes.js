import { Router } from "express";
import { protect, restrictTo } from "../utils/auth.js";
import {
  list,
  create,
  getById,
  update,
  remove,
} from "../controller/tickerAnnouncementController.js";

const router = Router();

router.get("/", list);
router.post("/", protect, restrictTo("admin"), create);
router.get("/:id", getById);
router.put("/:id", protect, restrictTo("admin"), update);
router.delete("/:id", protect, restrictTo("admin"), remove);

export default router;
