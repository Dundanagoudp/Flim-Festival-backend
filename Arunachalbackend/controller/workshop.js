import Workshop from "../models/workshopModel.js";
import WorkshopCategory from "../models/workshopCategoryModel.js";
import multer from "multer";
import { saveBufferToLocal , deleteLocalByUrl } from "../utils/fileStorage.js";


const storage = multer.memoryStorage();
const upload = multer({ storage }).single("imageUrl");

export const addWorkshop = async (req, res) => {
  try {
    // run multer upload once (reject on error)
    if (req.is?.("multipart/form-data")) {
      await new Promise((resolve, reject) =>
        upload(req, res, (err) => (err ? reject(err) : resolve()))
      );
    }

    const { name, about, registrationFormUrl, categoryId } = req.body;
    const file = req.file;

    if (!name) return res.status(400).json({ message: "name is required" });

    let categoryRef = null;
    if (categoryId) {
      const category = await WorkshopCategory.findById(categoryId);
      if (!category) return res.status(400).json({ message: "Invalid categoryId" });
      categoryRef = categoryId;
    }

    let imageUrl = "";
    console.log("File received:", file);
    if (file?.buffer) {
       imageUrl = await saveBufferToLocal(file, "WorkShop");
    }

    const workshop = new Workshop({
      categoryRef,
      name,
      about,
      imageUrl ,
      registrationFormUrl,
    });

    await workshop.save({ validateBeforeSave: false });
    return res.status(201).json({ message: "Workshop added successfully", workshop });
  } catch (error) {
    console.error("Error adding workshop:", error);
    // surface the real error message for easier debugging (remove in prod)
    return res.status(500).json({ message: "Server error", error: error?.message || String(error) });
  }
};


export const getWorkshop = async (req, res) => {
  try {
    const { categoryId, groupByCategory } = req.query;
    const filter = categoryId ? { categoryRef: categoryId } : {};

    if (groupByCategory === "true") {
      const categories = await WorkshopCategory.find().sort({ order: 1 }).lean();
      const workshops = await Workshop.find().populate("categoryRef").lean();
      const byCategory = categories.map((cat) => ({
        category: cat,
        workshops: workshops.filter((w) => w.categoryRef && w.categoryRef._id.toString() === cat._id.toString()),
      }));
      const uncategorized = workshops.filter((w) => !w.categoryRef);
      if (uncategorized.length > 0) {
        byCategory.push({ category: { _id: null, name: "Uncategorized", order: 999 }, workshops: uncategorized });
      }
      return res.status(200).json(byCategory);
    }

    const workshops = await Workshop.find(filter).populate("categoryRef");
    res.status(200).json(workshops);
  } catch (error) {
    console.error("Error getting workshops:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateWorkshop = async (req, res) => {
  try {
    if (req.is?.("multipart/form-data")) {
      await new Promise((resolve, reject) =>
        upload(req, res, (err) => (err ? reject(err) : resolve()))
      );
    }
    const { workshopId } = req.params;
    const { name, about, registrationFormUrl, categoryId } = req.body;
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    let categoryRef = workshop.categoryRef;
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await WorkshopCategory.findById(categoryId);
        if (!category) return res.status(400).json({ message: "Invalid categoryId" });
        categoryRef = categoryId;
      } else {
        categoryRef = null;
      }
    }

    const file = req.file;
    let newImageUrl = workshop.imageUrl;
    if (file && file.buffer) {
      if (workshop.imageUrl) {
        await deleteLocalByUrl(workshop.imageUrl);
      }
      newImageUrl = await saveBufferToLocal(file, "WorkShop");
    }

    const updatedworkshop = await Workshop.findByIdAndUpdate(
      workshopId,
      {
        name: name?.trim() || workshop.name,
        about: about?.trim() || workshop.about,
        imageUrl: newImageUrl,
        registrationFormUrl: registrationFormUrl ?? workshop.registrationFormUrl,
        categoryRef,
      },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "workshop updated successfully", updatedworkshop });
  } catch (error) {
    console.error("Error updating workshop:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteWorkshop = async (req, res) => {
  const { workshopId } = req.params;
  try {
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    if (workshop.imageUrl) {
      await deleteLocalByUrl(workshop.imageUrl);
    }
    await Workshop.findByIdAndDelete(workshopId);
    res.status(200).json({ message: "Workshop deleted successfully" });
  } catch (error) {
    console.error("Error deleting workshop:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Category CRUD ---
export const addCategory = async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ message: "name is required" });
    const category = new WorkshopCategory({
      name: String(name).trim(),
      order: order != null ? Number(order) : 0,
    });
    await category.save();
    return res.status(201).json({ message: "Category added successfully", category });
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).json({ message: "Server error", error: error?.message || String(error) });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await WorkshopCategory.find().sort({ order: 1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error getting categories:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, order } = req.body;
    const category = await WorkshopCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (order !== undefined) updates.order = Number(order);
    const updated = await WorkshopCategory.findByIdAndUpdate(categoryId, updates, { new: true });
    res.status(200).json({ message: "Category updated successfully", category: updated });
  } catch (error) {
    console.error("Error updating category:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await WorkshopCategory.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });
    const workshopCount = await Workshop.countDocuments({ categoryRef: categoryId });
    if (workshopCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category: it has workshops. Reassign or delete them first.",
        workshopCount,
      });
    }
    await WorkshopCategory.findByIdAndDelete(categoryId);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
