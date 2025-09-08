// routes/nomination.routes.js
import { Router } from "express";
import {
  createNomination,
  listNominations,
  getNominationById,
  updateNominationById,
  deleteNominationById,
} from "../controller/nominationController.js";

import { protect, restrictTo } from "../utils/auth.js";
import upload from "../utils/multerMemory.js";

const router = Router();
const handleFileUpload = (req, res, next) => {
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

router.post("/", protect, restrictTo("admin"), handleFileUpload, createNomination);
router.put("/:id", protect, restrictTo("admin"), handleFileUpload, updateNominationById);

router.get("/", listNominations);
router.get("/:id", getNominationById);
router.delete("/:id", protect, restrictTo("admin"), deleteNominationById);

export default router;