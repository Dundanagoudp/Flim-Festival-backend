// controller/curatedController.js
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";
import CuratedCategory from "../models/curatedCategoryModel.js";
import CuratedImage from "../models/curatedImageModel.js";
import mongoose from "mongoose";

// --- Categories ---

export const getCategories = async (req, res) => {
  try {
    const { public: publicOnly } = req.query;
    const filter = publicOnly === "true" ? { public: true } : {};
    const categories = await CuratedCategory.find(filter).sort({ order: 1, createdAt: 1 });
    return res.json({ categories });
  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, public: isPublic, order } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    const category = new CuratedCategory({
      name: String(name).trim(),
      slug: slug != null ? String(slug).trim() : "",
      public: isPublic !== false,
      order: order != null ? Number(order) : 0,
    });
    await category.save();
    return res.status(201).json(category);
  } catch (err) {
    console.error("createCategory error:", err);
    return res.status(500).json({ message: "Failed to create category" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, public: isPublic, order } = req.body;
    const doc = await CuratedCategory.findById(id);
    if (!doc) return res.status(404).json({ message: "Category not found" });
    if (name !== undefined) doc.name = String(name).trim();
    if (slug !== undefined) doc.slug = String(slug).trim();
    if (isPublic !== undefined) doc.public = !!isPublic;
    if (order !== undefined) doc.order = Number(order);
    await doc.save();
    return res.json(doc);
  } catch (err) {
    console.error("updateCategory error:", err);
    return res.status(500).json({ message: "Failed to update category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await CuratedCategory.findById(id);
    if (!doc) return res.status(404).json({ message: "Category not found" });
    const imageCount = await CuratedImage.countDocuments({ category: id });
    if (imageCount > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete category that has images. Remove or move images first." });
    }
    await CuratedCategory.findByIdAndDelete(id);
    return res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    return res.status(500).json({ message: "Failed to delete category" });
  }
};

// --- Images ---

function parseNum(val) {
  if (val === "" || val === undefined || val === null) return 0;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function parseStr(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

/** Build response object with all CuratedImage fields so response always includes every field. */
function imageToResponse(doc) {
  if (!doc) return doc;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    _id: d._id,
    category: d.category,
    title: d.title ?? "",
    image: d.image ?? "",
    order: d.order ?? 0,
    jury_name: d.jury_name ?? "",
    designation: d.designation ?? "",
    short_bio: d.short_bio ?? "",
    full_biography: d.full_biography ?? "",
    film_synopsis: d.film_synopsis ?? "",
    display_order: d.display_order ?? 0,
    status: d.status ?? "",
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export const getImagesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }
    const images = await CuratedImage.find({ category: categoryId })
      .populate("category")
      .sort({ display_order: 1, order: 1, createdAt: 1 });
    return res.json({ images: images.map(imageToResponse) });
  } catch (err) {
    console.error("getImagesByCategory error:", err);
    return res.status(500).json({ message: "Failed to fetch images" });
  }
};

export const uploadImage = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      category: categoryId,
      title,
      order,
      jury_name,
      designation,
      short_bio,
      full_biography,
      film_synopsis,
      display_order,
      status,
    } = body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Image file is required" });
    }
    if (!categoryId) {
      return res.status(400).json({ message: "Category is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid category id" });
    }
    const categoryExists = await CuratedCategory.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category not found" });
    }

    const imagePath = await saveBufferToLocal(req.file, "curated");

    const image = new CuratedImage({
      category: categoryId,
      title: String(title).trim(),
      image: imagePath,
      order: parseNum(order),
      jury_name: parseStr(jury_name),
      designation: parseStr(designation),
      short_bio: parseStr(short_bio),
      full_biography: parseStr(full_biography),
      film_synopsis: parseStr(film_synopsis),
      display_order: parseNum(display_order),
      status: parseStr(status),
    });
    await image.save();
    await image.populate("category");

    return res.status(201).json(imageToResponse(image));
  } catch (err) {
    console.error("uploadImage error:", err);
    return res.status(500).json({ message: err.message || "Failed to upload image" });
  }
};

export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const doc = await CuratedImage.findById(id);
    if (!doc) return res.status(404).json({ message: "Image not found" });

    const {
      category,
      title,
      order,
      jury_name,
      designation,
      short_bio,
      full_biography,
      film_synopsis,
      display_order,
      status,
    } = body;

    if (title !== undefined) doc.title = String(title).trim();
    if (order !== undefined) doc.order = parseNum(order);
    if (jury_name !== undefined) doc.jury_name = parseStr(jury_name);
    if (designation !== undefined) doc.designation = parseStr(designation);
    if (short_bio !== undefined) doc.short_bio = parseStr(short_bio);
    if (full_biography !== undefined) doc.full_biography = parseStr(full_biography);
    if (film_synopsis !== undefined) doc.film_synopsis = parseStr(film_synopsis);
    if (display_order !== undefined) doc.display_order = parseNum(display_order);
    if (status !== undefined) doc.status = parseStr(status);
    if (category !== undefined && mongoose.Types.ObjectId.isValid(category)) {
      const catExists = await CuratedCategory.findById(category);
      if (catExists) doc.category = category;
    }

    if (req.file && req.file.buffer) {
      const newPath = await saveBufferToLocal(req.file, "curated");
      if (doc.image) await deleteLocalByUrl(doc.image).catch(() => {});
      doc.image = newPath;
    }

    await doc.save();
    await doc.populate("category");
    return res.json(imageToResponse(doc));
  } catch (err) {
    console.error("updateImage error:", err);
    return res.status(500).json({ message: "Failed to update image" });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await CuratedImage.findById(id);
    if (!doc) return res.status(404).json({ message: "Image not found" });
    if (doc.image) await deleteLocalByUrl(doc.image).catch(() => {});
    await CuratedImage.findByIdAndDelete(id);
    return res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("deleteImage error:", err);
    return res.status(500).json({ message: "Failed to delete image" });
  }
};

export const getGroupedImages = async (req, res) => {
  try {
    const categories = await CuratedCategory.find({ public: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    const grouped = [];
    for (const cat of categories) {
      const imageDocs = await CuratedImage.find({ category: cat._id }).sort({
        display_order: 1,
        order: 1,
        createdAt: 1,
      });
      grouped.push({ category: cat, images: imageDocs.map(imageToResponse) });
    }
    return res.json({ grouped });
  } catch (err) {
    console.error("getGroupedImages error:", err);
    return res.status(500).json({ message: "Failed to fetch grouped images" });
  }
}
