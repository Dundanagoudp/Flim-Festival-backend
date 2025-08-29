import express from "express";
import {createRegistration,getAllRegistration,getRegistrationById,updateRegistration,deleteRegistration} from "../controller/registrationController.js";
const router = express.Router();    
import {protect,restrictTo} from "../utils/auth.js";

router.post("/createRegistration",createRegistration);
router.get("/getAllRegistration",getAllRegistration);
router.get("/getRegistrationById/:id",getRegistrationById);
router.put("/updateRegistrationById/:id", protect,restrictTo("admin"), updateRegistration);
router.delete("/deleteRegistartionById/:id", protect, restrictTo("admin"), deleteRegistration);

export default router;