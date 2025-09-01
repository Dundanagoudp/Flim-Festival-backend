import express from "express";
import multer from "multer";
import {protect,restrictTo} from "../utils/auth.js";
import {createSubmission,getAllSubmissions,getSubmissionById,updateSubmissions,deleteSubmission} from "../controller/submissionController.js";
const router = express.Router();

import upload from "../utils/multerMemory.js"; // the file we created above


router.post("/createSubmission",  upload.single("videoFile"), createSubmission);
router.get("/getAllSubmission",getAllSubmissions);
router.get("/getSubmissionById/:id",getSubmissionById);
router.put("/updateSubmissionById/:id",protect,restrictTo("admin"),updateSubmissions);
router.delete("/deleteSubmissionById/:id",protect,restrictTo("admin"),deleteSubmission);

export default router;