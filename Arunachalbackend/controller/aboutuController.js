import {
  AboutUsBanner,
  AboutUsStatistics,
  AboutUsLookInside,
  AboutUsItem,
} from "../models/aboutusModels.js";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";

// Section-specific GET endpoints (public)
const getAboutUsBanner = async (req, res) => {
  try {
    const bannerDoc = await AboutUsBanner.findOne();
    if (!bannerDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Banner content retrieved successfully",
      data: {
        id: bannerDoc._id,
        title: bannerDoc.title,
        backgroundImage: bannerDoc.backgroundImage,
      },
    });
  } catch (error) {
    console.error("Error fetching banner:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching banner content",
      });
  }
};

// Removed main content handler

const getAboutUsStatistics = async (req, res) => {
  try {
    const statsDoc = await AboutUsStatistics.findOne();
    if (!statsDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Statistics not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: {
        id: statsDoc._id,
        years: statsDoc.years,
        films: statsDoc.films,
        countries: statsDoc.countries,
        image: statsDoc.image,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching statistics",
      });
  }
};

// Look Inside - GET (public)
const getAboutUsLookInside = async (req, res) => {
  try {
    const lookDoc = await AboutUsLookInside.findOne();
    if (!lookDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Look Inside not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Look Inside content retrieved successfully",
      data: {
        id: lookDoc._id,
        title: lookDoc.title,
        description: lookDoc.description,
        image: lookDoc.image,
      },
    });
  } catch (error) {
    console.error("Error fetching lookInside:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while fetching lookInside content",
      });
  }
};

const deleteAboutUsBanner = async (req, res) => {
  try {
    const bannerDoc = await AboutUsBanner.findOne();
    if (!bannerDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
    await deleteLocalByUrl(bannerDoc.backgroundImage);
    const deletedId = bannerDoc._id;
    await bannerDoc.deleteOne();
    return res
      .status(200)
      .json({
        success: true,
        message: "Banner document deleted",
        data: { id: deletedId },
      });
  } catch (error) {
    console.error("Error deleting banner:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while deleting banner" });
  }
};

const deleteAboutUsStatistics = async (req, res) => {
  try {
    const statsDoc = await AboutUsStatistics.findOne();
    if (!statsDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Statistics not found" });
    }
    await deleteLocalByUrl(statsDoc.image);
    const deletedId = statsDoc._id;
    await statsDoc.deleteOne();
    return res
      .status(200)
      .json({
        success: true,
        message: "Statistics document deleted",
        data: { id: deletedId },
      });
  } catch (error) {
    console.error("Error deleting statistics:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while deleting statistics",
      });
  }
};

const deleteAboutUsBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const bannerDoc = await AboutUsBanner.findById(id);
    if (!bannerDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
    await deleteLocalByUrl(bannerDoc.backgroundImage);
    await bannerDoc.deleteOne();
    return res
      .status(200)
      .json({
        success: true,
        message: "Banner document deleted",
        data: { id },
      });
  } catch (error) {
    console.error("Error deleting banner by id:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while deleting banner" });
  }
};

const deleteAboutUsStatisticsById = async (req, res) => {
  try {
    const { id } = req.params;
    const statsDoc = await AboutUsStatistics.findById(id);
    if (!statsDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Statistics not found" });
    }
    await deleteLocalByUrl(statsDoc.image);
    await statsDoc.deleteOne();
    return res
      .status(200)
      .json({
        success: true,
        message: "Statistics document deleted",
        data: { id },
      });
  } catch (error) {
    console.error("Error deleting statistics by id:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while deleting statistics",
      });
  }
};

// Removed three columns handler

// Section-specific CREATE/UPDATE endpoints (admin only)
const createOrUpdateBanner = async (req, res) => {
  try {
    const { title } = req.body;
    let backgroundImage = "";

    // Handle file upload to Firebase if present
if (req.file?.buffer) { backgroundImage = await saveBufferToLocal(req.file, "banner"); }

    const bannerData = {
      title: title || "",
      backgroundImage: backgroundImage || req.body.backgroundImage || "",
    };

    let bannerDoc = await AboutUsBanner.findOne();
    if (bannerDoc) {
      if (!backgroundImage && !req.body.backgroundImage) {
        bannerData.backgroundImage = bannerDoc.backgroundImage;
      }
      bannerDoc.title = bannerData.title;
      bannerDoc.backgroundImage = bannerData.backgroundImage;
      await bannerDoc.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Banner updated successfully",
          data: {
            id: bannerDoc._id,
            title: bannerDoc.title,
            backgroundImage: bannerDoc.backgroundImage,
          },
        });
    }

    bannerDoc = new AboutUsBanner(bannerData);
    await bannerDoc.save();
    return res
      .status(201)
      .json({
        success: true,
        message: "Banner created successfully",
        data: {
          id: bannerDoc._id,
          title: bannerDoc.title,
          backgroundImage: bannerDoc.backgroundImage,
        },
      });
  } catch (error) {
    console.error("Error creating/updating banner:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while creating/updating banner",
      });
  }
};

// Removed main content updater

const createOrUpdateStatistics = async (req, res) => {
  try {
    const statisticsData = req.body || {};
    let uploadedImageUrl = "";

    // If an image file is present, upload to Firebase similar to banner
    if (req.file?.buffer) {
      uploadedImageUrl = await saveBufferToLocal(req.file, "statistics");
    }

    // Compose final stats payload; allow passing image as URL when no file
    const mergedStatistics = {
      years: Number(statisticsData.years) || 0,
      films: Number(statisticsData.films) || 0,
      countries: Number(statisticsData.countries) || 0,
      image: uploadedImageUrl || statisticsData.image || "",
    };

    let statsDoc = await AboutUsStatistics.findOne();
    if (statsDoc) {
      if (!uploadedImageUrl && !statisticsData.image && statsDoc.image) {
        mergedStatistics.image = statsDoc.image;
      }
      statsDoc.years = mergedStatistics.years;
      statsDoc.films = mergedStatistics.films;
      statsDoc.countries = mergedStatistics.countries;
      statsDoc.image = mergedStatistics.image;
      await statsDoc.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Statistics updated successfully",
          data: {
            id: statsDoc._id,
            years: statsDoc.years,
            films: statsDoc.films,
            countries: statsDoc.countries,
            image: statsDoc.image,
          },
        });
    }

    statsDoc = new AboutUsStatistics(mergedStatistics);
    await statsDoc.save();
    return res
      .status(201)
      .json({
        success: true,
        message: "Statistics created successfully",
        data: {
          id: statsDoc._id,
          years: statsDoc.years,
          films: statsDoc.films,
          countries: statsDoc.countries,
          image: statsDoc.image,
        },
      });
  } catch (error) {
    console.error("Error creating/updating statistics:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while creating/updating statistics",
      });
  }
};

// Removed three columns updater

// Look Inside - CREATE/UPDATE (admin)
const createOrUpdateLookInside = async (req, res) => {
  try {
    const title = (req.body?.title || "").trim();
    const description = (req.body?.description || "").trim();
    let uploadedImageUrl = "";

  if (req.file?.buffer) { uploadedImageUrl = await saveBufferToLocal(req.file, "lookinside"); }

    const payload = {
      title,
      description,
      image: uploadedImageUrl || req.body.image || "",
    };

    let lookDoc = await AboutUsLookInside.findOne();

    if (lookDoc) {
      // preserve existing image if no new upload or image field provided
      if (!payload.image && lookDoc.image) payload.image = lookDoc.image;

      lookDoc.title = payload.title;
      lookDoc.description = payload.description;
      lookDoc.image = payload.image;
      await lookDoc.save();

      return res.status(200).json({
        success: true,
        message: "Look Inside updated successfully",
        data: {
          id: lookDoc._id,
          title: lookDoc.title,
          description: lookDoc.description,
          image: lookDoc.image,
        },
      });
    }

    lookDoc = new AboutUsLookInside(payload);
    await lookDoc.save();

    return res.status(201).json({
      success: true,
      message: "Look Inside created successfully",
      data: {
        id: lookDoc._id,
        title: lookDoc.title,
        description: lookDoc.description,
        image: lookDoc.image,
      },
    });
  } catch (error) {
    console.error("Error creating/updating lookInside:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while creating/updating lookInside",
      });
  }
};

// ID-based UPDATE endpoints
const updateAboutUsBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title = "" } = req.body || {};
    let newImageUrl = "";

    const bannerDoc = await AboutUsBanner.findById(id);
    if (!bannerDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

  if (req.file?.buffer) { newImageUrl = await saveBufferToLocal(req.file, "bannerfire"); }

    // Clean up previous image if a new one is uploaded
    if (
      newImageUrl &&
      bannerDoc.backgroundImage &&
      bannerDoc.backgroundImage !== newImageUrl
    ) {
      await deleteLocalByUrl(bannerDoc.backgroundImage);
    }

    bannerDoc.title = title;
    bannerDoc.backgroundImage =
      newImageUrl ||
      req.body.backgroundImage ||
      bannerDoc.backgroundImage ||
      "";
    await bannerDoc.save();

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: {
        id: bannerDoc._id,
        title: bannerDoc.title,
        backgroundImage: bannerDoc.backgroundImage,
      },
    });
  } catch (error) {
    console.error("Error updating banner by id:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while updating banner" });
  }
};

const updateAboutUsStatisticsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { years, films, countries } = req.body || {};
    let newImageUrl = "";

    const statsDoc = await AboutUsStatistics.findById(id);
    if (!statsDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Statistics not found" });
    }

if (req.file?.buffer) { newImageUrl = await saveBufferToLocal(req.file, "statistics"); }

    if (newImageUrl && statsDoc.image && statsDoc.image !== newImageUrl) {
      await deleteLocalByUrl(statsDoc.image);
    }

    statsDoc.years = years !== undefined ? Number(years) : statsDoc.years;
    statsDoc.films = films !== undefined ? Number(films) : statsDoc.films;
    statsDoc.countries =
      countries !== undefined ? Number(countries) : statsDoc.countries;
    statsDoc.image = newImageUrl || req.body.image || statsDoc.image || "";
    await statsDoc.save();

    return res.status(200).json({
      success: true,
      message: "Statistics updated successfully",
      data: {
        id: statsDoc._id,
        years: statsDoc.years,
        films: statsDoc.films,
        countries: statsDoc.countries,
        image: statsDoc.image,
      },
    });
  } catch (error) {
    console.error("Error updating statistics by id:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while updating statistics",
      });
  }
};

const updateAboutUsLookInsideById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title = "", description = "" } = req.body || {};
    let newImageUrl = "";

    const lookDoc = await AboutUsLookInside.findById(id);
    if (!lookDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Look Inside not found" });
    }

    if (req.file) {
      try {
        newImageUrl = await saveBufferToLocal(req.file, "lookinside");
      } catch (uploadError) {
        return res
          .status(500)
          .json({
            success: false,
            message: "Error uploading image",
          });
      }
    }

    if (newImageUrl && lookDoc.image && lookDoc.image !== newImageUrl) {
      await deleteLocalByUrl(lookDoc.image);
    }

    lookDoc.title = title !== undefined ? title : lookDoc.title;
    lookDoc.description =
      description !== undefined ? description : lookDoc.description;
    lookDoc.image = newImageUrl || req.body.image || lookDoc.image || "";
    await lookDoc.save();

    return res.status(200).json({
      success: true,
      message: "Look Inside updated successfully",
      data: {
        id: lookDoc._id,
        title: lookDoc.title,
        description: lookDoc.description,
        image: lookDoc.image,
      },
    });
  } catch (error) {
    console.error("Error updating lookInside by id:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while updating lookInside",
      });
  }
};

// Look Inside - DELETE (active)
const deleteAboutUsLookInside = async (req, res) => {
  try {
    const lookDoc = await AboutUsLookInside.findOne();
    if (!lookDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Look Inside not found" });
    }
    await deleteLocalByUrl(lookDoc.image);
    const deletedId = lookDoc._id;
    await lookDoc.deleteOne();
    return res
      .status(200)
      .json({
        success: true,
        message: "Look Inside document deleted",
        data: { id: deletedId },
      });
  } catch (error) {
    console.error("Error deleting lookInside:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while deleting lookInside",
      });
  }
};

// Look Inside - DELETE by ID
const deleteAboutUsLookInsideById = async (req, res) => {
  try {
    const { id } = req.params;
    const lookDoc = await AboutUsLookInside.findById(id);
    if (!lookDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Look Inside not found" });
    }
    await deleteLocalByUrl(lookDoc.image);
    await lookDoc.deleteOne();
    return res
      .status(200)
      .json({
        success: true,
        message: "Look Inside document deleted",
        data: { id },
      });
  } catch (error) {
    console.error("Error deleting lookInside by id:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error while deleting lookInside",
      });
  }
};

// --- About Items (multiple scrollable items, 8–10 max; each item can have multiple images) ---
const toImagesArray = (doc) => {
  if (Array.isArray(doc.images)) return doc.images;
  if (doc.image) return [doc.image];
  return [];
};

const getAboutUsItems = async (req, res) => {
  try {
    const items = await AboutUsItem.find().sort({ index: 1 }).lean();
    const data = items.map((doc) => ({
      id: doc._id,
      index: doc.index,
      title: doc.title,
      subtitle: doc.subtitle || "",
      description: doc.description || "",
      images: toImagesArray(doc),
    }));
    return res.status(200).json({
      success: true,
      message: "About items retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching about items:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while fetching about items" });
  }
};

const MAX_IMAGES_PER_ITEM = 10;

const createAboutUsItem = async (req, res) => {
  try {
    const count = await AboutUsItem.countDocuments();
    if (count >= 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 about items allowed",
      });
    }
    const title = (req.body?.title || "").trim();
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }
    const index = req.body.index !== undefined ? Number(req.body.index) : count;
    const subtitle = (req.body?.subtitle || "").trim();
    const description = (req.body?.description || "").trim();
    const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
    const imageUrls = [];
    for (const file of files) {
      if (file?.buffer) {
        const url = await saveBufferToLocal(file, "aboutitems");
        imageUrls.push(url);
      }
    }
    if (imageUrls.length > MAX_IMAGES_PER_ITEM) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_IMAGES_PER_ITEM} images per item`,
      });
    }
    const item = new AboutUsItem({
      index,
      title,
      subtitle,
      description,
      images: imageUrls,
    });
    await item.save();
    return res.status(201).json({
      success: true,
      message: "About item created successfully",
      data: {
        id: item._id,
        index: item.index,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        images: item.images,
      },
    });
  } catch (error) {
    console.error("Error creating about item:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while creating about item" });
  }
};

const updateAboutUsItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await AboutUsItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "About item not found" });
    }
    const title = req.body?.title !== undefined ? (req.body.title || "").trim() : item.title;
    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    const index = req.body.index !== undefined ? Number(req.body.index) : item.index;
    const subtitle = req.body.subtitle !== undefined ? (req.body.subtitle || "").trim() : item.subtitle;
    const description = req.body.description !== undefined ? (req.body.description || "").trim() : item.description;
    let currentImages = toImagesArray(item);
    const removeIndex = req.body.removeImageIndex !== undefined ? Number(req.body.removeImageIndex) : NaN;
    if (!Number.isNaN(removeIndex) && removeIndex >= 0 && removeIndex < currentImages.length) {
      const removedUrl = currentImages[removeIndex];
      if (removedUrl) await deleteLocalByUrl(removedUrl);
      currentImages = currentImages.filter((_, i) => i !== removeIndex);
    }
    const newFiles = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
    const newUrls = [];
    for (const file of newFiles) {
      if (file?.buffer) {
        const url = await saveBufferToLocal(file, "aboutitems");
        newUrls.push(url);
      }
    }
    const updatedImages = [...currentImages, ...newUrls];
    if (updatedImages.length > MAX_IMAGES_PER_ITEM) {
      for (const url of newUrls) await deleteLocalByUrl(url);
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_IMAGES_PER_ITEM} images per item`,
      });
    }
    item.index = index;
    item.title = title;
    item.subtitle = subtitle;
    item.description = description;
    item.images = updatedImages;
    await item.save();
    return res.status(200).json({
      success: true,
      message: "About item updated successfully",
      data: {
        id: item._id,
        index: item.index,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        images: item.images,
      },
    });
  } catch (error) {
    console.error("Error updating about item:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while updating about item" });
  }
};

const deleteAboutUsItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await AboutUsItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: "About item not found" });
    }
    const urls = toImagesArray(item);
    for (const url of urls) {
      if (url) await deleteLocalByUrl(url);
    }
    await item.deleteOne();
    return res.status(200).json({
      success: true,
      message: "About item deleted",
      data: { id },
    });
  } catch (error) {
    console.error("Error deleting about item:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while deleting about item" });
  }
};

export {
  // Section-specific GET endpoints
  getAboutUsBanner,
  getAboutUsStatistics,
  // Look Inside GET
  getAboutUsLookInside,

  // Section-specific CREATE/UPDATE endpoints
  createOrUpdateBanner,
  createOrUpdateStatistics,
  // Look Inside CREATE/UPDATE
  createOrUpdateLookInside,

  // Section-specific DELETE endpoints
  deleteAboutUsBanner,
  deleteAboutUsStatistics,
  deleteAboutUsLookInside,
  // ID-based DELETE endpoints
  deleteAboutUsBannerById,
  deleteAboutUsStatisticsById,
  deleteAboutUsLookInsideById,
  // ID-based UPDATE endpoints
  updateAboutUsBannerById,
  updateAboutUsStatisticsById,
  updateAboutUsLookInsideById,
  // About Items
  getAboutUsItems,
  createAboutUsItem,
  updateAboutUsItemById,
  deleteAboutUsItemById,
};
