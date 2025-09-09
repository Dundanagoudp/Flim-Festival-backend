import Submission from "../models/submissionModel.js";
import { bucket } from "../config/firebaseConfig.js"; // your firebase setup
import { notifyAdminsOfSubmission } from "../middleware/mailService.js";

const createSubmission = async (req, res) => {
  try {
    let videoUrl = null;

    if (req.file) {
      const fileName = `videos/${Date.now()}_${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
      await file.makePublic(); // ensure your bucket/policy allows this
      videoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    const submissionData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      videoType: req.body.videoType,
      videoFile: videoUrl || req.body.videoFile, // fallback if URL provided
      message: req.body.message,
    };

    const newSubmission = new Submission(submissionData);
    const savedSubmission = await newSubmission.save();

    // Notify admins (don’t block the response)
    (async () => {
      try {
        await notifyAdminsOfSubmission(savedSubmission);
      } catch (mailErr) {
        console.error("Failed to send submission notification:", mailErr);
      }
    })();

    res.status(201).json(savedSubmission);
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getSubmissionById = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }
        res.status(200).json(submission);
    } catch (error) {
        console.error("Error fetching submission:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAllSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find();
        res.status(200).json(submissions);
    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteSubmission = async (req, res) => {
    try {
        const deletedSubmission = await Submission.findByIdAndDelete(req.params.id);
        if (!deletedSubmission) {
            return res.status(404).json({ message: "Submission not found" });
        }
        res.status(200).json({ message: "Submission deleted successfully" });
    } catch (error) {
        console.error("Error deleting submission:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateSubmissions = async (req, res) => {
    try {
        const updatedSubmission = await Submission.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedSubmission) {
            return res.status(404).json({ message: "Submission not found" });
        }
        res.status(200).json(updatedSubmission);
    } catch (error) {
        console.error("Error updating submission:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { createSubmission, getSubmissionById, getAllSubmissions, deleteSubmission, updateSubmissions };