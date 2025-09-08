// controllers/HomepageController.js
import Homepage from "../models/HomepageModel.js";
import { bucket } from "../config/firebaseConfig.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload a Multer in-memory file buffer to Firebase Storage.
 * Returns a public download URL that works with Uniform Bucket-Level Access.
 */
async function uploadVideoToFirebase(file, folder = "homepage") {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeName = file.originalname.replace(/\s+/g, "_");
  const filePath = `${folder}/${unique}-${safeName}`;

  const token = uuidv4();
  const blob = bucket.file(filePath);

  await blob.save(file.buffer, {
    metadata: {
      contentType: file.mimetype || "application/octet-stream",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
    resumable: false, // single-shot upload from buffer
    validation: "md5",
  });

  // Public URL with token
  const publicUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
    `${encodeURIComponent(filePath)}?alt=media&token=${token}`;

  return { publicUrl, filePath, token };
}

export const createHomepage = async (req, res) => {
  try {
    const { title, description, video: videoUrlFromBody } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    let videoUrl = videoUrlFromBody || "";

    if (req.file) {
      const { publicUrl } = await uploadVideoToFirebase(req.file, "homepage");
      videoUrl = publicUrl;
    }

    const homepage = await Homepage.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      video: videoUrl,
    });

    return res.status(201).json(homepage);
  } catch (error) {
    console.error("Create homepage error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getAllHomepages = async (req, res) => {
  try {
    const homepages = await Homepage.find().sort({ createdAt: -1 });
    res.status(200).json(homepages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHomepage = async (req, res) => {
  try {
    // If you really want the very first/only one:
    // const homepage = await Homepage.findOne();
    const { id } = req.params;
    const homepage = await Homepage.findById(id);
    if (!homepage) return res.status(404).json({ error: "Homepage not found" });
    res.status(200).json(homepage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHomepage = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Homepage.findById(id);
    if (!existing) return res.status(404).json({ error: "Homepage not found" });

    const payload = {};
    if (typeof req.body.title !== "undefined") {
      payload.title = String(req.body.title).trim();
    }
    if (typeof req.body.description !== "undefined") {
      payload.description = String(req.body.description).trim();
    }

    // Decide video URL:
    let videoUrl = existing.video;
    if (req.file) {
      const { publicUrl } = await uploadVideoToFirebase(req.file, "homepage");
      videoUrl = publicUrl;
    } else if (typeof req.body.video !== "undefined") {
      // allow direct URL override
      videoUrl = String(req.body.video).trim();
    }

    if (videoUrl !== existing.video) payload.video = videoUrl;

    const updated = await Homepage.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Update homepage error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteHomepage = async (req, res) => {
  try {
    const { id } = req.params;
    const homepage = await Homepage.findByIdAndDelete(id);
    if (!homepage) return res.status(404).json({ error: "Homepage not found" });
    res.status(200).json(homepage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
