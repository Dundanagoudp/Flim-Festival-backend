import Gallery from "../models/galleryModel.js";
import GalleryYear from "../models/galleryYearModel.js";
import GalleryDay from "../models/galleryDayModel.js";
import multer from "multer";
import { deleteLocalByUrl, saveBufferToLocal, saveMultipleToLocal } from "../utils/fileStorage.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'photo', maxCount: 10 },
  { name: 'photos', maxCount: 10 }
]);

export const addGalleryImage = async (req, res) => {
  try {
    // Handle multipart form data upload once
    if (req.is?.("multipart/form-data")) {
      await new Promise((resolve, reject) =>
        upload(req, res, (err) => (err ? reject(err) : resolve()))
      );
    }

    const { caption, year, day, photo: photoUrlFromBody } = req.body;

    if (!year) return res.status(400).json({ message: "year is required" });
    if (!day) return res.status(400).json({ message: "day is required" });

    const yearDoc = await GalleryYear.findById(year);
    if (!yearDoc) return res.status(400).json({ message: "Invalid year" });

    const dayDoc = await GalleryDay.findById(day);
    if (!dayDoc) return res.status(400).json({ message: "Invalid day" });
    if (dayDoc.year.toString() !== yearDoc._id.toString()) {
      return res.status(400).json({ message: "Day does not belong to selected year" });
    }

    // Get files from both 'photo' and 'photos' fields
    const files = [];
    if (req.file) files.push(req.file);
    if (req.files) {
      // If a concrete named field returns array
      if (Array.isArray(req.files.photo)) files.push(...req.files.photo);
      else if (req.files.photo) files.push(req.files.photo);
    
      if (Array.isArray(req.files.photos)) files.push(...req.files.photos);
      else if (req.files.photos) files.push(req.files.photos);
    }


    const photoUrls = [];
    if (files.length > 0) {
      const saves = await Promise.all(
        files.map((f) => saveBufferToLocal(f, "gallery")) // returns single path per file
      );
      photoUrls.push(...saves.filter(Boolean));
    }

    // Handle single photo URL from body
    if (photoUrlFromBody) photoUrls.push(photoUrlFromBody);

    if (photoUrls.length === 0) {
      return res.status(400).json({ message: "Provide photo files or photo URL" });
    }

    // Create gallery entries in bulk for better performance
    const galleryData = photoUrls.map(photoUrl => ({
      caption,
      year: yearDoc._id,
      day: dayDoc._id,
      photo: photoUrl
    }));

    const items = await Gallery.insertMany(galleryData);

    res.status(201).json({ message: `${items.length} image(s) added`, items });
  } catch (err) {
    console.error("Add gallery image error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getGalleryGroupedByYear = async (_req, res) => {
  try {
    const items = await Gallery.find().populate("year", "value").sort({ createdAt: -1 });
    const map = new Map();
    items.forEach(it => {
      const y = it.year?.value; if (y === undefined) return;
      if (!map.has(y)) map.set(y, []);
      map.get(y).push({ _id: it._id, caption: it.caption, photo: it.photo });
    });
    const result = Array.from(map.entries()).map(([yearValue, images]) => ({ year: yearValue, images })).sort((a, b) => b.year - a.year);
    res.status(200).json(result);
  } catch (err) {
    console.error("Get gallery grouped error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getGalleryByYear = async (req, res) => {
  try {
    const { year, yearId, dayId } = req.query;
    let yearDoc = null;
    if (yearId) {
      yearDoc = await GalleryYear.findById(yearId);
    } else if (year) {
      yearDoc = await GalleryYear.findOne({ value: parseInt(year) });
    }
    if (!yearDoc) return res.status(400).json({ message: "Provide valid year or yearId" });

    const filter = { year: yearDoc._id };
    if (dayId) filter.day = dayId;

    const items = await Gallery.find(filter).populate("day", "name date order").sort({ createdAt: -1 });
    const imagePayload = (i) => ({ _id: i._id, caption: i.caption, photo: i.photo, day: i.day });

    if (dayId) {
      return res.status(200).json({
        year: yearDoc.value,
        dayId,
        images: items.map(imagePayload)
      });
    }

    // Group by day for year-only request
    const days = await GalleryDay.find({ year: yearDoc._id }).sort({ order: 1, createdAt: 1 });
    const dayMap = new Map(days.map(d => [d._id.toString(), { _id: d._id, name: d.name, date: d.date, order: d.order, images: [] }]));
    const imagesWithoutDay = [];
    items.forEach((i) => {
      const payload = { _id: i._id, caption: i.caption, photo: i.photo };
      if (i.day) {
        const dayIdStr = (i.day._id || i.day).toString();
        if (dayMap.has(dayIdStr)) dayMap.get(dayIdStr).images.push(payload);
        else imagesWithoutDay.push(payload);
      } else {
        imagesWithoutDay.push(payload);
      }
    });
    const daysArray = Array.from(dayMap.values()).map(d => ({ ...d, images: d.images }));
    res.status(200).json({
      year: yearDoc.value,
      days: daysArray,
      imagesWithoutDay
    });
  } catch (err) {
    console.error("Get gallery by year error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Gallery.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: "Image not found" });
    if (item.photo) {
      await deleteLocalByUrl(item.photo);
    }
    res.status(200).json({ message: "Image deleted" });
  } catch (err) {
    console.error("Delete gallery image error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Bulk delete images
export const bulkDeleteImages = async (req, res) => {
  try {
    const { imageIds } = req.body;
    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ message: "imageIds array is required" });
    }

    // Find all images to get their photo URLs
    const images = await Gallery.find({ _id: { $in: imageIds } });
    if (images.length === 0) {
      return res.status(404).json({ message: "No images found" });
    }

    // Delete files from Firebase
    const deletePromises = images.map(async (image) => {
      if (image.photo) {
        await deleteLocalByUrl(image.photo);
      }
    });
    await Promise.all(deletePromises);

    // Delete from database
    const result = await Gallery.deleteMany({ _id: { $in: imageIds } });

    res.status(200).json({
      message: `${result.deletedCount} image(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Bulk delete images error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createYear = async (req, res) => {
  try {
    const { value, active, name } = req.body;
    if (value === undefined || value === null) {
      return res.status(400).json({ message: "value is required" });
    }
    const yearNumber = parseInt(value);
    if (Number.isNaN(yearNumber)) {
      return res.status(400).json({ message: "value must be a number" });
    }
    if (yearNumber < 1900 || yearNumber > 2100) {
      return res.status(400).json({ message: "value must be between 1900 and 2100" });
    }

    const exists = await GalleryYear.findOne({ value: yearNumber });
    if (exists) {
      return res.status(400).json({ message: "Year already exists" });
    }

    const created = await GalleryYear.create({ value: yearNumber, name, active: active === undefined ? true : Boolean(active) });
    return res.status(201).json({ message: "Year created", item: created });
  } catch (err) {
    console.error("Create year error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update year
export const updateYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, active, name } = req.body;

    const year = await GalleryYear.findById(id);
    if (!year) {
      return res.status(404).json({ message: "Year not found" });
    }

    if (value !== undefined) {
      const yearNumber = parseInt(value);
      if (Number.isNaN(yearNumber)) {
        return res.status(400).json({ message: "value must be a number" });
      }
      if (yearNumber < 1900 || yearNumber > 2100) {
        return res.status(400).json({ message: "value must be between 1900 and 2100" });
      }

      // Check if new value already exists (excluding current year)
      if (yearNumber !== year.value) {
        const exists = await GalleryYear.findOne({ value: yearNumber });
        if (exists) {
          return res.status(400).json({ message: "Year value already exists" });
        }
      }
      year.value = yearNumber;
    }

    if (active !== undefined) {
      year.active = Boolean(active);
    }

    if (name !== undefined) {
      year.name = name;
    }

    await year.save();
    res.status(200).json({ message: "Year updated successfully", year });
  } catch (err) {
    console.error("Update year error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete year
export const deleteYear = async (req, res) => {
  try {
    const { id } = req.params;
    const year = await GalleryYear.findById(id);
    if (!year) {
      return res.status(404).json({ message: "Year not found" });
    }

    const imageCount = await Gallery.countDocuments({ year: id });
    if (imageCount > 0) {
      return res.status(400).json({
        message: `Cannot delete year. It has ${imageCount} associated image(s). Delete images first.`
      });
    }

    const dayCount = await GalleryDay.countDocuments({ year: id });
    if (dayCount > 0) {
      await GalleryDay.deleteMany({ year: id });
    }

    await GalleryYear.findByIdAndDelete(id);
    res.status(200).json({ message: "Year deleted successfully" });
  } catch (err) {
    console.error("Delete year error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getYears = async (_req, res) => {
  try {
    const years = await GalleryYear.find().sort({ value: -1 });
    return res.status(200).json(years);
  } catch (err) {
    console.error("Get years error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// --- Day CRUD (year → days → images) ---

export const getDaysByYear = async (req, res) => {
  try {
    const { yearId } = req.query;
    if (!yearId) return res.status(400).json({ message: "yearId is required" });
    const yearDoc = await GalleryYear.findById(yearId);
    if (!yearDoc) return res.status(404).json({ message: "Year not found" });
    const days = await GalleryDay.find({ year: yearId }).sort({ order: 1, createdAt: 1 });
    return res.status(200).json(days);
  } catch (err) {
    console.error("Get days by year error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createDay = async (req, res) => {
  try {
    const { yearId, name, date, order } = req.body;
    if (!yearId || !name) return res.status(400).json({ message: "yearId and name are required" });
    const yearDoc = await GalleryYear.findById(yearId);
    if (!yearDoc) return res.status(404).json({ message: "Year not found" });
    const created = await GalleryDay.create({
      year: yearId,
      name: name.trim(),
      date: date ? new Date(date) : undefined,
      order: order != null ? Number(order) : 0
    });
    return res.status(201).json({ message: "Day created", item: created });
  } catch (err) {
    console.error("Create day error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateDay = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, order } = req.body;
    const day = await GalleryDay.findById(id);
    if (!day) return res.status(404).json({ message: "Day not found" });
    if (name !== undefined) day.name = name.trim();
    if (date !== undefined) day.date = date ? new Date(date) : undefined;
    if (order !== undefined) day.order = Number(order);
    await day.save();
    return res.status(200).json({ message: "Day updated", item: day });
  } catch (err) {
    console.error("Update day error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteDay = async (req, res) => {
  try {
    const { id } = req.params;
    const day = await GalleryDay.findById(id);
    if (!day) return res.status(404).json({ message: "Day not found" });
    const imageCount = await Gallery.countDocuments({ day: id });
    if (imageCount > 0) {
      return res.status(400).json({
        message: `Cannot delete day. It has ${imageCount} image(s). Delete images first.`
      });
    }
    await GalleryDay.findByIdAndDelete(id);
    return res.status(200).json({ message: "Day deleted successfully" });
  } catch (err) {
    console.error("Delete day error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


