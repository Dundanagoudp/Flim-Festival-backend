import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import {
  addWorkshop,
  deleteWorkshop,
  getWorkshop,
  updateWorkshop,
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controller/workshop.js";

const workshopRoute = express.Router();

// Workshop CRUD
workshopRoute.post("/addWorkshop", protect, restrictTo("admin"), addWorkshop);
workshopRoute.put("/updateWorkshop/:workshopId", protect, restrictTo("admin", "editor"), updateWorkshop);
workshopRoute.delete("/deleteWorkshop/:workshopId", protect, restrictTo("admin"), deleteWorkshop);
workshopRoute.get("/getWorkshop", getWorkshop);

// Category CRUD
workshopRoute.post("/addCategory", protect, restrictTo("admin"), addCategory);
workshopRoute.get("/getCategories", getCategories);
workshopRoute.put("/updateCategory/:categoryId", protect, restrictTo("admin", "editor"), updateCategory);
workshopRoute.delete("/deleteCategory/:categoryId", protect, restrictTo("admin"), deleteCategory);

export default workshopRoute;