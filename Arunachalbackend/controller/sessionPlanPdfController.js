import SessionPlan from "../models/SessionPlan.js";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";
import { ok, notFound, badReq, err } from "../utils/response.js";

const PDF_FOLDER = "session-plan-pdfs";

/** Build URL for frontend: stored value is /uploads/... so frontend uses BASE + "/api/v1" + pdfUrl */
function toApiPath(localPath) {
  if (!localPath) return "";
  return "/api/v1" + localPath;
}

/** POST upload plan PDF (override if exists) */
export async function uploadPlanPdf(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return badReq(res, "PDF file is required");
    }
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");

    if (plan.pdfUrl) {
      await deleteLocalByUrl(plan.pdfUrl);
      plan.pdfUrl = "";
    }

    const localPath = await saveBufferToLocal(req.file, PDF_FOLDER);
    plan.pdfUrl = localPath;
    await plan.save();

    return ok(res, { pdfUrl: toApiPath(plan.pdfUrl) });
  } catch (e) {
    return err(res, e);
  }
}

/** GET plan PDF URL */
export async function getPlanPdf(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    if (!plan.pdfUrl) return notFound(res, "No PDF for this plan");
    return ok(res, { pdfUrl: toApiPath(plan.pdfUrl) });
  } catch (e) {
    return err(res, e);
  }
}

/** POST upload day PDF (override if exists) */
export async function uploadDayPdf(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return badReq(res, "PDF file is required");
    }
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");

    if (day.pdfUrl) {
      await deleteLocalByUrl(day.pdfUrl);
      day.pdfUrl = "";
    }

    const localPath = await saveBufferToLocal(req.file, PDF_FOLDER);
    day.pdfUrl = localPath;
    await plan.save();

    return ok(res, { pdfUrl: toApiPath(day.pdfUrl) });
  } catch (e) {
    return err(res, e);
  }
}

/** GET day PDF URL */
export async function getDayPdf(req, res) {
  try {
    const plan = await SessionPlan.findById(req.params.planId);
    if (!plan) return notFound(res, "Plan not found");
    const day = plan.days.id(req.params.dayId);
    if (!day) return notFound(res, "Day not found");
    if (!day.pdfUrl) return notFound(res, "No PDF for this day");
    return ok(res, { pdfUrl: toApiPath(day.pdfUrl) });
  } catch (e) {
    return err(res, e);
  }
}
