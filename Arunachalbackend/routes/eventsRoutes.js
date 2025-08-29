import express from "express";
import{ createEvent, getEvents, getEventById, deleteEventById, updateEventById }from "../controller/eventsController.js";
import { protect, restrictTo } from "../utils/auth.js";
import upload from "../utils/multerMemory.js";
const router = express.Router();

router.post("/createEvent", protect, restrictTo("admin"), upload.array("images"), createEvent);
router.get("/getAllEvents", getEvents);
router.get("/getEventById/:id", getEventById);
router.put("/updateEventById/:id", protect,restrictTo("admin"), updateEventById);
router.delete("/deleteEventById/:id", protect, restrictTo("admin"), deleteEventById);

export default router;