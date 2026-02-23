import TickerAnnouncement from "../models/TickerAnnouncementModel.js";
import { ok, created, notFound, badReq, err } from "../utils/response.js";

/** GET list all ticker announcements (public, for frontend ticker) */
export async function list(req, res) {
  try {
    const docs = await TickerAnnouncement.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return ok(res, docs);
  } catch (e) {
    return err(res, e);
  }
}

/** POST create one announcement (admin) */
export async function create(req, res) {
  try {
    const text = req.body.text != null ? String(req.body.text).trim() : "";
    if (!text) return badReq(res, "text is required");
    const order = req.body.order != null ? Number(req.body.order) : 0;
    const doc = await TickerAnnouncement.create({ text, order });
    return created(res, doc);
  } catch (e) {
    return err(res, e);
  }
}

/** GET one by id */
export async function getById(req, res) {
  try {
    const doc = await TickerAnnouncement.findById(req.params.id).lean();
    if (!doc) return notFound(res, "Ticker announcement not found");
    return ok(res, doc);
  } catch (e) {
    return err(res, e);
  }
}

/** PUT update by id (admin) */
export async function update(req, res) {
  try {
    const doc = await TickerAnnouncement.findById(req.params.id);
    if (!doc) return notFound(res, "Ticker announcement not found");
    if (req.body.text !== undefined) doc.text = String(req.body.text).trim();
    if (req.body.order !== undefined) doc.order = Number(req.body.order);
    await doc.save();
    return ok(res, doc);
  } catch (e) {
    return err(res, e);
  }
}

/** DELETE by id (admin) */
export async function remove(req, res) {
  try {
    const doc = await TickerAnnouncement.findByIdAndDelete(req.params.id);
    if (!doc) return notFound(res, "Ticker announcement not found");
    return ok(res, { deleted: true });
  } catch (e) {
    return err(res, e);
  }
}
