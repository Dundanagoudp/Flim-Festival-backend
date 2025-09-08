// controllers/HomepageController.js
import Homepage from "../models/HomepageModel.js";
import { bucket } from "../config/firebaseConfig.js";

export const createHomepage = async (req, res) => {
  try {
    const { title, description, image: imageUrlFromBody } = req.body;
    
    // Basic validations
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    let imageUrl = imageUrlFromBody || "";

    // Handle file upload if a file was provided
    if (req.file) {
      const file = req.file;
      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const fileName = `homepage/${uniqueSuffix}-${file.originalname}`;
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

    // Create the homepage
    const homepage = new Homepage({
      title: String(title).trim(),
      description: String(description || "").trim(),
      image: imageUrl,
    });

    await homepage.save();

    res.status(201).json(homepage);
  } catch (error) {
    console.error("Create homepage error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getHomepage = async (req, res) => {
  try {
    const homepage = await Homepage.findOne();
    res.status(200).json(homepage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHomepage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image: imageUrlFromBody } = req.body;

    // Check if homepage exists
    const existingHomepage = await Homepage.findById(id);
    if (!existingHomepage) {
      return res.status(404).json({ error: "Homepage not found" });
    }

    // Prepare update payload
    const payload = {};
    
    if (title !== undefined) payload.title = String(title).trim();
    if (description !== undefined) payload.description = String(description).trim();
    
    let imageUrl = imageUrlFromBody || existingHomepage.image;

    // Handle file upload if a file was provided
    if (req.file) {
      const file = req.file;
      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const fileName = `homepage/${uniqueSuffix}-${file.originalname}`;
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
    if (imageUrl !== existingHomepage.image) {
      payload.image = imageUrl;
    }

    // Update the homepage
    const updatedHomepage = await Homepage.findByIdAndUpdate(
      id,
      payload,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedHomepage);
  } catch (error) {
    console.error("Update homepage error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteHomepage = async (req, res) => {
  try {
    const { id } = req.params;
    const homepage = await Homepage.findByIdAndDelete(id);
    if (!homepage) {
      return res.status(404).json({ error: "Homepage not found" });
    }
    res.status(200).json(homepage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllHomepages = async (req, res) => {
  try {
    const homepages = await Homepage.find();
    res.status(200).json(homepages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};