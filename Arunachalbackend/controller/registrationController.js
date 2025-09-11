
// controllers/registrationController.js
import Registration from "../models/registrationModel.js";
import { notifyAdminsOfRegistration } from "../middleware/mailService.js";

const createRegistration = async (req, res) => {
  try {
    const newRegistration = new Registration(req.body);
    const savedRegistration = await newRegistration.save();

    // Fire-and-forget email (non-blocking for the API response)
    (async () => {
      try {
        const response = await notifyAdminsOfRegistration(savedRegistration);
// Response logged for debugging
      } catch (mailErr) {
        console.error("Failed to send admin notification:", mailErr);
      }
    })();

    res.status(201).json(savedRegistration);
  } catch (error) {
    console.error("Error creating registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllRegistration = async (req, res) => {
  try {
    const registrations = await Registration.find();
    res.status(200).json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json(registration);
  } catch (error) {
    console.error("Error fetching registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteRegistration = async (req, res) => {
  try {
    const deletedRegistration = await Registration.findByIdAndDelete(req.params.id);
    if (!deletedRegistration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateRegistration = async (req, res) => {
  try {
    const { contacted } = req.body; // explicitly update only this field
    const updatedRegistration = await Registration.findByIdAndUpdate(
      req.params.id,
      { contacted },
      { new: true }
    );
    if (!updatedRegistration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json(updatedRegistration);
  } catch (error) {
    console.error("Error updating registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  createRegistration,
  getAllRegistration,
  getRegistrationById,
  deleteRegistration,
  updateRegistration,
};
