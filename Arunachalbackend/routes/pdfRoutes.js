import express from "express";
import uploadPdf from "../utils/multerPdf.js";
import {
  uploadPdf as uploadPdfController,
  listPdfs,
  getPdfById,
  previewPdf,
  deletePdf,
} from "../controller/pdfController.js";

const router = express.Router();

router.post("/", uploadPdf.single("pdf"), uploadPdfController);
router.get("/", listPdfs);
router.get("/:id/preview", previewPdf);
router.get("/:id", getPdfById);
router.delete("/:id", deletePdf);

export default router;
