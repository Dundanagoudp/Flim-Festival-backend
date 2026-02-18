import VideoBlog from "../models/videosModel.js";
import upload from "../utils/multerMemory.js";
import { saveBufferToLocal , deleteLocalByUrl } from "../utils/fileStorage.js";

function cleanYouTubeUrl(url) {
  if (!url) return url;
  if (url.includes("youtu.be")) {
    const videoId = url.split("/").pop().split("?")[0];
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  if (url.includes("youtube.com")) {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/watch?v=${match[2]}`;
    }
  }
  return url;
}

export const addVideoBlog = async (req, res) => {
  const handleUpload = () =>
    new Promise((resolve, reject) => {
      upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
      ])(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  try {
    await handleUpload();
    const { title, videoType, addedAt, youtubeUrl } = req.body;
    if (videoType === "youtube") {
      if (!youtubeUrl) {
        return res.status(400).json({ message: "Please enter YouTube URL" });
      }
      const cleanedUrl = cleanYouTubeUrl(youtubeUrl);
      const created = await VideoBlog.create({
        title,
        videoType,
        addedAt,
        youtubeUrl: cleanedUrl,
      });
      return res.status(201).json(created);
    }
    if (videoType === "video") {
      if (!req.files || !req.files.video || !req.files.thumbnail) {
        return res
          .status(400)
          .json({ message: "Both video and thumbnail files are required" });
      }
      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail[0];
      const [videoUrl, thumbnailUrl] = await Promise.all([
        saveBufferToLocal(videoFile, "VideoBlog/videos"),
        saveBufferToLocal(thumbnailFile, "VideoBlog/thumbnails"),
      ]);
      const created = await VideoBlog.create({
        title,
        videoType,
        addedAt,
        video_url: videoUrl,
        imageUrl: thumbnailUrl,
      });
      return res.status(201).json(created);
    }
    return res.status(400).json({ message: "Invalid video type" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVideoBlog = async (req, res) => {
  try {
    const videoBlog = await VideoBlog.find();
    res.status(200).json(videoBlog);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVideoBlogById = async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoBlog = await VideoBlog.findById(videoId);
    res.status(200).json(videoBlog);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getYoutubeVideo = async (req, res) => {
  try {
    const videoBlog = await VideoBlog.find({ videoType: "youtube" });
    if (!videoBlog) return res.status(404).json({ message: "Video Blog not found" });
    res.status(200).json(videoBlog);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getRawVideo = async (req, res) => {
  try {
    const videoBlog = await VideoBlog.find({ videoType: "video" });
    if (!videoBlog) return res.status(404).json({ message: "Video Blog not found" });
    res.status(200).json(videoBlog);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getRawVideoById = async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoBlog = await VideoBlog.findOne({ _id: videoId, videoType: "video" });
    if (!videoBlog) {
      return res.status(404).json({ message: "Raw video not found or not a raw video type" });
    }
    res.status(200).json(videoBlog);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateVideoBlog = async (req, res) => {
  const handleUpload = () =>
    new Promise((resolve, reject) => {
      upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
      ])(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  try {
    await handleUpload();
    const { videoId } = req.params;
    const { title, videoType, addedAt, youtubeUrl } = req.body;
    const videoBlog = await VideoBlog.findById(videoId);
    if (!videoBlog) return res.status(404).json({ message: "Video blog not found" });

    if (videoType === "youtube") {
      const cleanedUrl = cleanYouTubeUrl(youtubeUrl);
      const updated = await VideoBlog.findByIdAndUpdate(
        videoId,
        { title, videoType, addedAt, youtubeUrl: cleanedUrl },
        { new: true }
      );
      return res.status(200).json({ message: "YouTube video updated successfully", videoBlog: updated });
    }

    if (videoType === "video") {
      let videoFile = null;
      let thumbnailFile = null;
      let videoUrl = videoBlog.video_url;
      let thumbnailUrl = videoBlog.imageUrl;
      if (req.files) {
        if (req.files.video) videoFile = req.files.video[0];
        if (req.files.thumbnail) thumbnailFile = req.files.thumbnail[0];
        const deletePromises = [];
        if (videoFile && videoBlog.video_url) deletePromises.push(deleteLocalByUrl(videoBlog.video_url));
        if (thumbnailFile && videoBlog.imageUrl) deletePromises.push(deleteLocalByUrl(videoBlog.imageUrl));
        await Promise.all(deletePromises);
        if (videoFile) videoUrl = await saveBufferToLocal(videoFile, "VideoBlog/videos");
        if (thumbnailFile) thumbnailUrl = await saveBufferToLocal(thumbnailFile, "VideoBlog/thumbnails");
      }
      const updated = await VideoBlog.findByIdAndUpdate(
        videoId,
        { title, videoType, addedAt, video_url: videoUrl, imageUrl: thumbnailUrl },
        { new: true }
      );
      return res.status(200).json({ message: "Video updated successfully", videoBlog: updated });
    }
    return res.status(400).json({ message: "Invalid video type" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteVideoBlog = async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoBlog = await VideoBlog.findById(videoId);
    if (!videoBlog) return res.status(404).json({ message: "Video blog not found" });
    if (videoBlog.video_url) await deleteLocalByUrl(videoBlog.video_url);
    if (videoBlog.imageUrl) await deleteLocalByUrl(videoBlog.imageUrl);
    await VideoBlog.findByIdAndDelete(videoId);
    res.status(200).json({ message: "Video blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};


