import HeroBanner from "../models/HeroBannerModel.js";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";
import { ok, created, notFound, err } from "../utils/response.js";

const HERO_BANNER_FOLDER = "hero-banner";

function toPublicUrl(storedPath) {
  if (!storedPath) return "";
  return "/api/v1" + storedPath;
}

/** GET current hero banner (public) */
export async function getCurrent(req, res) {
  try {
    const doc = await HeroBanner.findOne().lean();
    if (!doc) return notFound(res, "Hero banner not found");
    const data = {
      ...doc,
      video: toPublicUrl(doc.video),
    };
    return ok(res, data);
  } catch (e) {
    return err(res, e);
  }
}

/** POST or PUT: create or update the single current hero banner (admin) */
export async function createOrUpdate(req, res) {
  try {
    const title = req.body.title != null ? String(req.body.title).trim() : "";
    const subtitle = req.body.subtitle != null ? String(req.body.subtitle).trim() : "";

    let doc = await HeroBanner.findOne();

    if (doc) {
      if (req.file && req.file.buffer) {
        if (doc.video) await deleteLocalByUrl(doc.video);
        doc.video = await saveBufferToLocal(req.file, HERO_BANNER_FOLDER);
      }
      doc.title = title;
      doc.subtitle = subtitle;
      await doc.save();
      const data = doc.toObject();
      data.video = toPublicUrl(doc.video);
      return ok(res, data);
    }

    let videoUrl = "";
    if (req.file && req.file.buffer) {
      videoUrl = await saveBufferToLocal(req.file, HERO_BANNER_FOLDER);
    }
    doc = await HeroBanner.create({ video: videoUrl, title, subtitle });
    const data = doc.toObject();
    data.video = toPublicUrl(doc.video);
    return created(res, data);
  } catch (e) {
    return err(res, e);
  }
}

/** DELETE current hero banner (admin) */
export async function deleteCurrent(req, res) {
  try {
    const doc = await HeroBanner.findOne();
    if (!doc) return notFound(res, "Hero banner not found");
    if (doc.video) await deleteLocalByUrl(doc.video);
    await doc.deleteOne();
    return ok(res, { deleted: true });
  } catch (e) {
    return err(res, e);
  }
}
