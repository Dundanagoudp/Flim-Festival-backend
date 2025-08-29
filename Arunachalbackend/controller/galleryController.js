import Gallery from "../models/galleryModel.js";
import GalleryYear from "../models/galleryYearModel.js";
import { bucket } from "../config/firebaseConfig.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'photo', maxCount: 10 },
  { name: 'photos', maxCount: 10 }
]); 

export const addGalleryImage = async (req, res) => {
  const handleUpload = () => new Promise(resolve => {
    if (req.is && req.is("multipart/form-data")) { upload(req, res, () => resolve()); } else { resolve(); }
  });
  try {
    await handleUpload();
    const { caption, year, photo: photoUrlFromBody } = req.body;
    if (!year) return res.status(400).json({ message: "year is required" });
    const yearDoc = await GalleryYear.findById(year);
    if (!yearDoc) return res.status(400).json({ message: "Invalid year" });

    // Get files from both 'photo' and 'photos' fields
    const photoFiles = req.files?.photo || [];
    const photosFiles = req.files?.photos || [];
    const allFiles = [...photoFiles, ...photosFiles];
    
    let photoUrls = [];
    
    // Handle multiple files - UPLOAD IN PARALLEL for better performance
    if (allFiles && allFiles.length > 0) {
      const uploadPromises = allFiles.map(async (file) => {
        const fileName = `gallery/${yearDoc.value}/${Date.now()}-${Math.random()}-${file.originalname}`;
        const fileUpload = bucket.file(fileName);
        
        return new Promise((resolve, reject) => {
          const stream = fileUpload.createWriteStream({ metadata: { contentType: file.mimetype } });
          stream.on("error", reject);
          stream.on("finish", async () => { 
            try { 
              await fileUpload.makePublic(); 
              resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
            } catch (e) { 
              reject(e); 
            } 
          });
          stream.end(file.buffer);
        });
      });
      
      // Wait for all uploads to complete in parallel
      photoUrls = await Promise.all(uploadPromises);
    }
    
    // Handle single photo URL from body
    if (photoUrlFromBody) {
      photoUrls.push(photoUrlFromBody);
    }
    
    if (photoUrls.length === 0) return res.status(400).json({ message: "Provide photo files or photo URL" });

    // Create gallery entries in bulk for better performance
    const galleryData = photoUrls.map(photoUrl => ({
      caption,
      year: yearDoc._id,
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
    const result = Array.from(map.entries()).map(([yearValue, images]) => ({ year: yearValue, images })).sort((a,b) => b.year - a.year);
    res.status(200).json(result);
  } catch (err) {
    console.error("Get gallery grouped error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getGalleryByYear = async (req, res) => {
  try {
    const { year, yearId } = req.query;
    let yearDoc = null;
    if (yearId) {
      yearDoc = await GalleryYear.findById(yearId);
    } else if (year) {
      yearDoc = await GalleryYear.findOne({ value: parseInt(year) });
    }
    if (!yearDoc) return res.status(400).json({ message: "Provide valid year or yearId" });

    const items = await Gallery.find({ year: yearDoc._id }).sort({ createdAt: -1 });
    res.status(200).json({ year: yearDoc.value, images: items.map(i => ({ _id: i._id, caption: i.caption, photo: i.photo })) });
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
      const filePath = item.photo.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
      if (filePath) await bucket.file(filePath).delete().catch(() => {});
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
        const filePath = image.photo.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
        if (filePath) {
          return bucket.file(filePath).delete().catch(() => {});
        }
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

    // Check if year has associated images
    const imageCount = await Gallery.countDocuments({ year: id });
    if (imageCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete year. It has ${imageCount} associated image(s). Delete images first.` 
      });
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


