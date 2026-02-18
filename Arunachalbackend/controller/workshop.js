import Workshop from "../models/workshopModel.js";
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

    const { eventId } = req.params;
    const { name, about, registrationFormUrl } = req.body;
    const file = req.file;

    // basic validation
    if (!eventId) return res.status(400).json({ message: "eventId is required in params" });
    if (!name) return res.status(400).json({ message: "name is required" });

    let imageUrl = "";
    console.log("File received:", file);
    if (file?.buffer) {

       imageUrl = await saveBufferToLocal(file, "WorkShop");
    }

    const workshop = new Workshop({
      eventRef: eventId,
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
    const workshops = await Workshop.find();
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
    const { name, about, registrationFormUrl } = req.body;
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
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
      await deleteLocalByUrl(workshop.imageUrl);
    }
    await Workshop.findByIdAndDelete(workshopId);
    res.status(200).json({ message: "Workshop deleted successfully" });
  } catch (error) {
    console.error("Error deleting workshop:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
