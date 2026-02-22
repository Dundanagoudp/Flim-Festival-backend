import path from "path";
import fs from "fs";
import PdfDocument from "../models/PdfDocument.js";
import {
  saveBufferToLocal,
  deleteLocalByUrl,
  getUploadsRoot,
} from "../utils/fileStorage.js";
import { ok, created, notFound, badReq, err } from "../utils/response.js";

const PDF_FOLDER = "pdfs";

function toPublicUrl(storedPath) {
  if (!storedPath) return "";
  return "/api/v1" + storedPath;
}

/** POST upload PDF (create) */
export async function uploadPdf(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return badReq(res, "PDF file is required");
    }
    const name = (req.body && req.body.name) ? String(req.body.name).trim() : "";
    const pdfUrl = await saveBufferToLocal(req.file, PDF_FOLDER);
    const doc = await PdfDocument.create({ name, pdfUrl });
    const data = doc.toObject();
    data.pdfUrl = toPublicUrl(doc.pdfUrl);
    return created(res, data);
  } catch (e) {
    return err(res, e);
  }
}

/** GET list all PDFs */
export async function listPdfs(req, res) {
  try {
    const docs = await PdfDocument.find().sort({ createdAt: -1 }).lean();
    const data = docs.map((d) => ({
      ...d,
      pdfUrl: toPublicUrl(d.pdfUrl),
    }));
    return ok(res, data);
  } catch (e) {
    return err(res, e);
  }
}

/** GET one PDF by id (metadata + URL) */
export async function getPdfById(req, res) {
  try {
    const doc = await PdfDocument.findById(req.params.id).lean();
    if (!doc) return notFound(res, "PDF not found");
    const data = { ...doc, pdfUrl: toPublicUrl(doc.pdfUrl) };
    return ok(res, data);
  } catch (e) {
    return err(res, e);
  }
}

/** GET :id/preview — stream PDF for browser (inline) */
export async function previewPdf(req, res) {
  try {
    const doc = await PdfDocument.findById(req.params.id);
    if (!doc) return notFound(res, "PDF not found");
    const relative = doc.pdfUrl.replace(/^\/uploads\//, "");
    const absolutePath = path.join(getUploadsRoot(), relative);
    if (!fs.existsSync(absolutePath)) {
      return notFound(res, "PDF file not found");
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.sendFile(absolutePath);
  } catch (e) {
    return err(res, e);
  }
}

/** GET :id/download — stream PDF with attachment so browser offers Save */
function safeDownloadFilename(doc) {
  const raw = doc.name && String(doc.name).trim() ? String(doc.name).trim() : path.basename(doc.pdfUrl);
  const safe = raw.replace(/[\\/"\n\r]/g, "_").replace(/\s+/g, "_").slice(0, 200);
  return safe.endsWith(".pdf") ? safe : (safe || "schedule") + ".pdf";
}

export async function downloadPdf(req, res) {
  try {
    const doc = await PdfDocument.findById(req.params.id);
    if (!doc) return notFound(res, "PDF not found");
    const relative = doc.pdfUrl.replace(/^\/uploads\//, "");
    const absolutePath = path.join(getUploadsRoot(), relative);
    if (!fs.existsSync(absolutePath)) {
      return notFound(res, "PDF file not found");
    }
    const filename = safeDownloadFilename(doc);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(absolutePath);
  } catch (e) {
    return err(res, e);
  }
}

/** PUT update PDF by id — optional: new PDF file (multipart "pdf"), optional name (body) */
export async function updatePdf(req, res) {
  try {
    const doc = await PdfDocument.findById(req.params.id);
    if (!doc) return notFound(res, "PDF not found");

    if (req.file && req.file.buffer) {
      await deleteLocalByUrl(doc.pdfUrl);
      doc.pdfUrl = await saveBufferToLocal(req.file, PDF_FOLDER);
    }

    if (req.body && req.body.name !== undefined) {
      doc.name = String(req.body.name).trim();
    }

    await doc.save();
    const data = doc.toObject();
    data.pdfUrl = toPublicUrl(doc.pdfUrl);
    return ok(res, data);
  } catch (e) {
    return err(res, e);
  }
}

/** DELETE PDF by id (document + file) */
export async function deletePdf(req, res) {
  try {
    const doc = await PdfDocument.findById(req.params.id);
    if (!doc) return notFound(res, "PDF not found");
    await deleteLocalByUrl(doc.pdfUrl);
    await PdfDocument.findByIdAndDelete(req.params.id);
    return ok(res, { deleted: true });
  } catch (e) {
    return err(res, e);
  }
}
