// controllers/nominationController.js
import { bucket } from "../config/firebaseConfig.js";
import Nomination, { NOMINATION_TYPES } from "../models/nominationModel.js";

export const createNomination = async (req, res) => {
  try {
    const {
      title,
      description = "",
      type,
      image: imageUrlFromBody, // optional: direct URL in body
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
      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const fileName = `nominations/${type}/${uniqueSuffix}-${file.originalname}`;
      const fileUpload = bucket.file(fileName);

      // Upload file to Firebase
      imageUrl = await new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({
          metadata: { contentType: file.mimetype },
        });

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
    const {
      title,
      description,
      type,
      image: imageUrlFromBody,
    } = req.body;

    // Check if nomination exists
    const existingNomination = await Nomination.findById(id);
    if (!existingNomination) {
      return res.status(404).json({ error: "Nomination not found" });
    }

    // Prepare update payload
    const payload = {};
    
    if (title !== undefined) payload.title = String(title).trim();
    if (description !== undefined) payload.description = String(description).trim();
    
    // Validate type if provided
    if (type) {
      if (!NOMINATION_TYPES.includes(type)) {
        return res.status(400).json({
          error: `type must be one of: ${NOMINATION_TYPES.join(", ")}`,
        });
      }
      payload.type = type;
    }

    let imageUrl = imageUrlFromBody || existingNomination.image;

    // Handle file upload if a file was provided
    if (req.file) {
      const file = req.file;
      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const fileName = `nominations/${payload.type || existingNomination.type}/${uniqueSuffix}-${file.originalname}`;
      const fileUpload = bucket.file(fileName);

      // Upload file to Firebase
      imageUrl = await new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({
          metadata: { contentType: file.mimetype },
        });

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
    }

    // Add image to payload if we have a new URL
    if (imageUrl !== existingNomination.image) {
      payload.image = imageUrl;
    }

    // Update the nomination
    const updatedNomination = await Nomination.findByIdAndUpdate(
      id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.json(updatedNomination);
  } catch (err) {
    console.error("updateNominationById error:", err);
    return res.status(500).json({ error: "Failed to update nomination" });
  }
};
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