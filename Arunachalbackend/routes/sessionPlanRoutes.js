import express from "express";
import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controller/slotCategoryController.js";
import {
  getPlans,
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
  getDays,
  createDay,
  getDayById,
  updateDay,
  deleteDay,
  getScreens,
  createScreen,
  getScreenById,
  updateScreen,
  deleteScreen,
  getSlots,
  createSlot,
  getSlotById,
  updateSlot,
  deleteSlot,
} from "../controller/sessionPlanController.js";
const router = express.Router({ mergeParams: true });

// ─── Categories (must be before :planId so "categories" is not captured as planId) ───
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.get("/categories/:categoryId", getCategoryById);
router.put("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

// ─── Plans ─────────────────────────────────────────────────────────────────────────
router.get("/", getPlans);
router.post("/", createPlan);
router.get("/:planId", getPlanById);
router.put("/:planId", updatePlan);
router.delete("/:planId", deletePlan);

// ─── Days ───────────────────────────────────────────────────────────────────────────
router.get("/:planId/days", getDays);
router.post("/:planId/days", createDay);
router.get("/:planId/days/:dayId", getDayById);
router.put("/:planId/days/:dayId", updateDay);
router.delete("/:planId/days/:dayId", deleteDay);

// ─── Screens ───────────────────────────────────────────────────────────────────────
router.get("/:planId/days/:dayId/screens", getScreens);
router.post("/:planId/days/:dayId/screens", createScreen);
router.get("/:planId/days/:dayId/screens/:screenId", getScreenById);
router.put("/:planId/days/:dayId/screens/:screenId", updateScreen);
router.delete("/:planId/days/:dayId/screens/:screenId", deleteScreen);

// ─── Slots ──────────────────────────────────────────────────────────────────────────
router.get("/:planId/days/:dayId/screens/:screenId/slots", getSlots);
router.post("/:planId/days/:dayId/screens/:screenId/slots", createSlot);
router.get("/:planId/days/:dayId/screens/:screenId/slots/:slotId", getSlotById);
router.put("/:planId/days/:dayId/screens/:screenId/slots/:slotId", updateSlot);
router.delete("/:planId/days/:dayId/screens/:screenId/slots/:slotId", deleteSlot);

export default router;
