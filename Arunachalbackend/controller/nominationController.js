// controllers/nomination.controller.js
import Nomination, { NOMINATION_TYPES } from "../models/nominationModel.js";

export const createNomination = async (req, res) => {
  try {
    const { title, description, image, type } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!NOMINATION_TYPES.includes(type)) {
      return res.status(400).json({
        error: `type must be one of: ${NOMINATION_TYPES.join(", ")}`,
      });
    }

    const doc = await Nomination.create({ title, description, image, type });
    return res.status(201).json(doc);
  } catch (err) {
    console.error("createNomination error:", err);
    return res.status(500).json({ error: "Failed to create nomination" });
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

/**
 * Get single nomination by id
 */
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

/**
 * Update nomination by id
 * Body can include: { title?, description?, image?, type? }
 */
export const updateNominationById = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    if (payload.type && !NOMINATION_TYPES.includes(payload.type)) {
      return res.status(400).json({
        error: `type must be one of: ${NOMINATION_TYPES.join(", ")}`,
      });
    }

    const doc = await Nomination.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: "Nomination not found" });
    return res.json(doc);
  } catch (err) {
    console.error("updateNominationById error:", err);
    return res.status(500).json({ error: "Failed to update nomination" });
  }
};

/**
 * Delete nomination by id
 */
export const deleteNominationById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Nomination.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: "Nomination not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteNominationById error:", err);
    return res.status(500).json({ error: "Failed to delete nomination" });
  }
};
