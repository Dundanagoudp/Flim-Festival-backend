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

// Middleware to handle file upload for both POST and PUT requests
const handleFileUpload = (req, res, next) => {
  // Check if content-type is multipart/form-data
  if (req.is("multipart/form-data")) {
    // Use multer middleware for file upload
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: "File upload error", error: err.message });
      }
      next(); // Continue to the next middleware/controller
    });
  } else {
    // For JSON requests, just continue without file processing
    next();
  }
};

// Apply the file upload middleware to both POST and PUT routes
router.post("/", protect, restrictTo("admin"), handleFileUpload, createNomination);
router.put("/:id", protect, restrictTo("admin"), handleFileUpload, updateNominationById);

router.get("/", listNominations);
router.get("/:id", getNominationById);
router.delete("/:id", protect, restrictTo("admin"), deleteNominationById);

export default router;