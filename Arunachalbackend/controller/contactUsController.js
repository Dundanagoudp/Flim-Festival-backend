// src/controllers/contactUsController.js
import ContactUs from "../models/contactUsModels.js";
import { notifyAdminsOfContactUs } from "../middleware/mailService.js";

export const createContactUs = async (req, res) => {
  try {
    const contactUs = new ContactUs({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      subject: req.body.subject,
      message: req.body.message,
    });

    const saved = await contactUs.save();

    // Fire-and-forget admin email
    (async () => {
      try {
        await notifyAdminsOfContactUs(saved);
      } catch (mailErr) {
        console.error("Failed to send Contact Us notification:", mailErr);
      }
    })();

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating contact us:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllContactUs = async (_req, res) => {
  try {
    const contactUs = await ContactUs.find().sort({ createdAt: -1 });
    res.status(200).json(contactUs);
  } catch (err) {
    console.error("Error fetching contact us:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getContactUsById = async (req, res) => {
  try {
    const contactUs = await ContactUs.findById(req.params.id);
    if (!contactUs) return res.status(404).json({ message: "Contact us not found" });
    res.status(200).json(contactUs);
  } catch (err) {
    console.error("Error fetching contact us by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateContactUsById = async (req, res) => {
  try {
    // Option A: allow only 'resolved' to be toggled
    const payload = {};
    if (typeof req.body.resolved === "boolean") payload.resolved = req.body.resolved;

    // If you do want to allow full edits, replace 'payload' with 'req.body'
    const contactUs = await ContactUs.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!contactUs) return res.status(404).json({ message: "Contact us not found" });
    res.status(200).json(contactUs);
  } catch (err) {
    console.error("Error updating contact us by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteContactUsById = async (req, res) => {
  try {
    const contactUs = await ContactUs.findByIdAndDelete(req.params.id);
    if (!contactUs) return res.status(404).json({ message: "Contact us not found" });
    res.status(200).json({ message: "Contact us deleted successfully" });
  } catch (err) {
    console.error("Error deleting contact us by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};
