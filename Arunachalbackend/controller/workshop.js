import Workshop from "../models/workshopModel.js";
import { bucket } from "../config/firebaseConfig.js";
import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("imageUrl");

export const addWorkshop = async (req, res) => {
  const handleFileUpload = () => {
    return new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return reject(new Error("File upload failed: " + err.message));
        }
        resolve();
      });
    });
  };
  try {
    await handleFileUpload();
    const { eventId } = req.params;
    const { name, about, registrationFormUrl } = req.body;
    const file = req.file;
    let imageUrl = "";
    if (file) {
      const fileName = Date.now() + path.extname(file.originalname);
      const destination = `WorkShop/${fileName}`;
      const fileUpload = bucket.file(destination);

      // Upload the file to Google Cloud Storage
      await new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        stream.on("error", reject);

        stream.on("finish", async () => {
          try {
            await fileUpload.makePublic();
            imageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        stream.end(file.buffer);
      });
    }
    const workshop = new Workshop({
      eventRef: eventId,
      name,
      about,
      imageUrl,
      registrationFormUrl,
    });
    await workshop.save();
    res.status(200).json({ message: "Workshop added successfully" });
  } catch (error) {
    console.error("Error adding workshop:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getWorkshop = async (req, res) => {
  try {
    const workshops = await Workshop.find();
    res.status(200).json(workshops);
  } catch (error) {
    console.error("Error getting workshops:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateWorkshop = async (req, res) => {
  const handleFileUpload = () => {
    return new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  };
  try {
    await handleFileUpload();
    const { workshopId } = req.params;
    const { name, about, registrationFormUrl } = req.body;
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    const file = req.file;
    let newImageUrl = workshop.imageUrl;
    if (file && file.buffer) {
      if (workshop.imageUrl) {
        const oldFileName = workshop.imageUrl.split("/").pop();
        await bucket
          .file(oldFileName)
          .delete()
          .catch((err) => {
            console.warn("Old image delete warning:", err.message);
          });
        const newFileName = `${Date.now()}${path.extname(file.originalname)}`;
        const destination = `Workshop/${newFileName}`;
        const fileUpload = bucket.file(destination);

        await new Promise((resolve, reject) => {
          const stream = fileUpload.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
          });

          stream.on("error", reject);
          stream.on("finish", async () => {
            try {
              await fileUpload.makePublic();
              newImageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
              resolve();
            } catch (error) {
              reject(error);
            }
          });

          stream.end(file.buffer);
        });
      }
    }

    const updatedworkshop = await Workshop.findByIdAndUpdate(
      workshopId,
      {
        name: name?.trim() || workshop.name,
        about: about?.trim() || workshop.about,
        imageUrl: newImageUrl,
        registrationFormUrl: registrationFormUrl,
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
      const fileName = workshop.imageUrl.split("/").pop();
      await bucket
        .file(fileName)
        .delete()
        .catch((err) => {
          console.warn(
            "Warning: Failed to delete image from Firebase:",
            err.message
          );
        });
    }
    await Workshop.findByIdAndDelete(workshopId);
    res.status(200).json({ message: "Workshop deleted successfully" });
  } catch (error) {
    console.error("Error deleting workshop:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
