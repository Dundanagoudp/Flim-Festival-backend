// import multer from "multer";

// // store file in memory buffer instead of saving to /uploads
// const upload = multer({ storage: multer.memoryStorage() });

// export default upload;




// utils/multerMemory.js
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 512 }, // 512MB
  fileFilter: (req, file, cb) => {
    const mimetype = file.mimetype || "";
    if (mimetype.startsWith("image/") || mimetype.startsWith("video/")) {
      return cb(null, true);
    }
    cb(new Error("Only image or video files are allowed"));
  },
});

export default upload;
