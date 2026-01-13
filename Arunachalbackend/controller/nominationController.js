// controllers/nominationController.js
import { saveBufferToLocal ,deleteLocalByUrl } from "../utils/fileStorage.js";
import Nomination, { NOMINATION_TYPES } from "../models/nominationModel.js";


export const createNomination = async (req, res) => {
  try {
    const {
      title,
      description = "",
      type,
      image: imageUrlFromBody, 
    } = req.body;
// Request body logged for debugging
    // Basic validations
    if (!title || !type) {
      return res
        .status(400)
        .json({ message: "Both title and type are required" });
    }
    
    if (!NOMINATION_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid nomination type" });
    }

    let imageUrl = imageUrlFromBody || "";

    // Handle file upload if a file was provided
    if (req.file) {
      const file = req.file;
    
 


      imageUrl = await saveBufferToLocal(file, "nominations");
    }

    // If no image provided at all
    if (!imageUrl && !req.file) {
      return res
        .status(400)
        .json({ message: "Provide an image file or an image URL" });
    }

    // Create the nomination
    const nomination = new Nomination({
      title: String(title).trim(),
      description: String(description).trim(),
      type,
      image: imageUrl,
    });

    await nomination.save();

    return res
      .status(201)
      .json({ message: "Nomination created successfully", nomination });
  } catch (err) {
    console.error("Create nomination error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};




export const listNominations = async (req, res) => {
  try {
    const {
      type,
      q,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const filter = {};
    if (type) {
      if (!NOMINATION_TYPES.includes(type)) {
        return res.status(400).json({
          error: `Invalid type. Allowed: ${NOMINATION_TYPES.join(", ")}`,
        });
      }
      filter.type = type;
    }
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const [items, total] = await Promise.all([
      Nomination.find(filter)
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Nomination.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("listNominations error:", err);
    return res.status(500).json({ error: "Failed to fetch nominations" });
  }
};

export const getNominationById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Nomination.findById(id);
    if (!doc) return res.status(404).json({ error: "Nomination not found" });
    return res.json(doc);
  } catch (err) {
    console.error("getNominationById error:", err);
    return res.status(500).json({ error: "Failed to fetch nomination" });
  }
};

export const updateNominationById = async (req, res) => {
try {
    const { id } = req.params;
    const { title, description, type, image: imageUrlFromBody } = req.body;
    const file = req.file; 

    const existingNomination = await Nomination.findById(id);
    if (!existingNomination) return res.status(404).json({ error: "Nomination not found" });

    // Prepare update payload
    const payload = {};
    if (title !== undefined) payload.title = String(title).trim();
    if (description !== undefined) payload.description = String(description).trim();

    if (type !== undefined) {
      if (!NOMINATION_TYPES.includes(type)) {
        return res.status(400).json({ error: `type must be one of: ${NOMINATION_TYPES.join(", ")}` });
      }
      payload.type = type;
    }


    let newImageUrl = existingNomination.image;

    if (file?.buffer) {
      const saved = await saveBufferToLocal(file, "nominations");
      newImageUrl = saved;
      if (existingNomination.image) await deleteLocalByUrl(existingNomination.image).catch(() => {});
    } else if (imageUrlFromBody !== undefined) {
      newImageUrl = imageUrlFromBody || undefined;
      if (existingNomination.image && (!newImageUrl || newImageUrl !== existingNomination.image)) {
        await deleteLocalByUrl(existingNomination.image).catch(() => {});
      }
    }

    if (newImageUrl !== existingNomination.image) payload.image = newImageUrl;
    const updated = await Nomination.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    return res.json(updated);
  } catch (err) {
    console.error("updateNominationById error:", err);
    return res.status(500).json({ error: "Failed to update nomination" });
  }
};
export const deleteNominationById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Nomination.findByIdAndDelete(id);
    await deleteLocalByUrl(doc.image);
    if (!doc) return res.status(404).json({ error: "Nomination not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteNominationById error:", err);
    return res.status(500).json({ error: "Failed to delete nomination" });
  }
};