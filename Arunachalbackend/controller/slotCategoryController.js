import SlotCategory from "../models/SlotCategory.js";
import { ok, created, notFound, badReq, err } from "../utils/response.js";

/** GET list - ?visible=true for only visible (e.g. dropdown) */
export async function getCategories(req, res) {
  try {
    const filter =
      req.query.visible === "true" ? { isVisible: true } : {};
    const categories = await SlotCategory.find(filter)
      .sort({ order: 1, name: 1 });
    return ok(res, categories);
  } catch (e) {
    return err(res, e);
  }
}

/** POST create - body: { name, order?, isVisible? } */
export async function createCategory(req, res) {
  try {
    const body = req.body || {};
    if (!body.name || !String(body.name).trim()) {
      return badReq(res, "name is required");
    }
    const category = await SlotCategory.create({
      name: String(body.name).trim(),
      order: body.order != null ? Number(body.order) : 0,
      isVisible: body.isVisible !== undefined ? Boolean(body.isVisible) : true,
    });
    return created(res, category);
  } catch (e) {
    if (e.code === 11000) return badReq(res, "Category name already exists");
    return err(res, e);
  }
}

/** GET one by id */
export async function getCategoryById(req, res) {
  try {
    const category = await SlotCategory.findById(req.params.categoryId);
    if (!category) return notFound(res, "Category not found");
    return ok(res, category);
  } catch (e) {
    return err(res, e);
  }
}

/** PUT update - body: { name?, order?, isVisible? } */
export async function updateCategory(req, res) {
  try {
    const body = req.body || {};
    const category = await SlotCategory.findById(req.params.categoryId);
    if (!category) return notFound(res, "Category not found");
    if (body.name != null) category.name = String(body.name).trim();
    if (body.order != null) category.order = Number(body.order);
    if (body.isVisible !== undefined) category.isVisible = Boolean(body.isVisible);
    await category.save();
    return ok(res, category);
  } catch (e) {
    if (e.code === 11000) return badReq(res, "Category name already exists");
    return err(res, e);
  }
}

/** DELETE by id */
export async function deleteCategory(req, res) {
  try {
    const category = await SlotCategory.findByIdAndDelete(
      req.params.categoryId
    );
    if (!category) return notFound(res, "Category not found");
    return ok(res, { deleted: true });
  } catch (e) {
    return err(res, e);
  }
}
