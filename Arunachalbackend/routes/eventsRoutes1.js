import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import upload from "../utils/multerMemory.js";
import {
  addEvent,
  updateEventDay,
  addTime,
  updateTime,
  deleteEvent,
  getEvent,
  getTotalEvent,
  getEventDay,
  deleteTime,
  getTime,
  getFullEventDetails,
  uploadEventDayImage,
  updateEventDayWithImage,
  deleteEventDayImage,
} from "../controller/eventsController1.js";

const eventRoute = express.Router();

eventRoute.post("/addEvent", protect, restrictTo("admin"), addEvent);
eventRoute.put(
  "/updateEventDay/:eventDayId",
  protect,
  restrictTo("admin", "user"),
  updateEventDay
);
eventRoute.put(
  "/updateEventDayWithImage/:eventDayId",
  protect,
  restrictTo("admin"),
  upload.single("image"),
  updateEventDayWithImage
);
eventRoute.post(
  "/uploadEventDayImage/:eventDayId",
  protect,
  restrictTo("admin"),
  upload.single("image"),
  uploadEventDayImage
);
eventRoute.delete(
  "/deleteEventDayImage/:eventDayId",
  protect,
  restrictTo("admin"),
  deleteEventDayImage
);
eventRoute.post(
  "/addTime/:eventId/day/:eventDay_ref",
  protect,
  restrictTo("admin"),
  addTime
);
eventRoute.put(
  "/updateTime/day/:day_ref/time/:timeId",
  protect,
  restrictTo("admin", "user"),
  updateTime
);
eventRoute.delete("/deleteEvent/:eventId", protect, restrictTo("admin"), deleteEvent);
eventRoute.get("/getEvent", protect, restrictTo("admin", "user"), getEvent);
eventRoute.get("/totalEvent", getTotalEvent);
eventRoute.get("/getEventDay", protect, restrictTo("admin", "user"), getEventDay);
eventRoute.delete("/deleteTime/:timeId", protect, restrictTo("admin"), deleteTime);
eventRoute.get("/getTime", protect, restrictTo("admin", "user"), getTime);
eventRoute.get("/getFullEvent", getFullEventDetails);

export default eventRoute;


