import express from "express";

import { protect,restrictTo } from "../utils/auth.js";

import { createContactUs, getAllContactUs, getContactUsById, updateContactUsById, deleteContactUsById } from "../controller/contactUsController.js";

const router = express.Router();

router.post("/createContactUs",createContactUs);
router.get("/getAllContactUs", protect,restrictTo("admin"),getAllContactUs);
router.get("/getContactUsById/:id",protect,restrictTo("admin"),getContactUsById);
router.put("/updateContactUsById/:id",protect,restrictTo("admin"),updateContactUsById);
router.delete("/deleteContactUsById/:id",protect,restrictTo("admin"),deleteContactUsById);

export default router;