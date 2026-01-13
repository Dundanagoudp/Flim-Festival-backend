import Submission from "../models/submissionModel.js";
import { saveBufferToLocal , deleteLocalByUrl } from "../utils/fileStorage.js";
import { notifyAdminsOfSubmission } from "../middleware/mailService.js";

const createSubmission = async (req, res) => {
  try {
    let videoUrl = null;

    if (req.file) {
      const fileName = await saveBufferToLocal(req.file, "videos");
        videoUrl = fileName;
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
        await deleteLocalByUrl(deletedSubmission.videoFile);
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

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const updateData = { ...req.body };

    if (req.file) {
      // Delete old file only if it exists
      if (submission.videoFile) {
        try {
          await deleteLocalByUrl(submission.videoFile);
        } catch (err) {

          console.warn("Failed to delete old file:", err);
        }
      }

    
      const savedPath = await saveBufferToLocal(req.file, "videos");
      updateData.videoFile = savedPath;
    }

    // Update the document and return the new version
    const updatedSubmission = await Submission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export { createSubmission, getSubmissionById, getAllSubmissions, deleteSubmission, updateSubmissions };