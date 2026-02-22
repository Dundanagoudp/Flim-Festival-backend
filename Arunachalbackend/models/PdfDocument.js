import mongoose from "mongoose";

const pdfDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    pdfUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const PdfDocument =
  mongoose.models.PdfDocument ||
  mongoose.model("PdfDocument", pdfDocumentSchema);

export default PdfDocument;
