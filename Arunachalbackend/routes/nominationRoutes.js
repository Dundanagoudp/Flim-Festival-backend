// routes/nomination.routes.js
import { Router } from "express";
import {
  createNomination,
  listNominations,
  getNominationById,
  updateNominationById,
  deleteNominationById,
} from "../controller/nominationController.js";

import {protect,restrictTo} from "../utils/auth.js";

const router = Router();

router.post("/",protect,restrictTo("admin"), createNomination);
router.get("/", listNominations);
router.get("/:id", getNominationById);
router.put("/:id",protect,restrictTo("admin"),  updateNominationById);
router.delete("/:id", protect,restrictTo("admin"), deleteNominationById);

export default router;
