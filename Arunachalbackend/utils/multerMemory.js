import multer from "multer";

// store file in memory buffer instead of saving to /uploads
const upload = multer({ storage: multer.memoryStorage() });

export default upload;
