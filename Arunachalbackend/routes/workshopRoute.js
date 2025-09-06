import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { addWorkshop, deleteWorkshop, getWorkshop, updateWorkshop } from "../controller/workshop.js";

const workshopRoute = express.Router();


workshopRoute.post("/addWorkshop/:eventId",protect,restrictTo("admin"),addWorkshop);
workshopRoute.post("/updateWorkshop/:workshopId",protect,restrictTo("admin","user"),updateWorkshop);
workshopRoute.delete("/deleteWorkshop/:workshopId",protect,restrictTo("admin"),deleteWorkshop);
workshopRoute.get("/getWorkshop",getWorkshop);



export default workshopRoute;