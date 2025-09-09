import express from "express";
import {
  // Year management
  createYear,
  getAllYears,
  updateYear,
  deleteYear,
  createGuest,
  getAllGuests,
  getGuestsGroupedByYear,
  getSingleGuest,
  updateGuest,
  deleteGuest,
  getGuestsByYear
} from "../controller/guestController.js";
import { protect, restrictTo } from "../utils/auth.js";

const router = express.Router();

// Year Routes
router.post("/createYear", protect, restrictTo("admin", "editor"), createYear);
router.get("/years", getAllYears);
router.put("/years/:id", protect, restrictTo("admin", "editor"), updateYear);
router.delete("/years/:id", protect, restrictTo("admin"), deleteYear);

// Guest Routes
router.post("/addguests", protect, restrictTo("admin", "editor"), createGuest);
router.get("/allguests", getAllGuests);
router.get("/guests-yearwise", getGuestsGroupedByYear);
router.get("/guests/:id", getSingleGuest);
router.put("/guests/:id", protect, restrictTo("admin", "editor"), updateGuest);
router.delete("/guests/:id", protect, restrictTo("admin"), deleteGuest);
router.get("/guests/year/:yearId", getGuestsByYear);

export default router;
