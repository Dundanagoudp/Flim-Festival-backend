import multer from "multer";

const storage = multer.memoryStorage();

const uploadPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const mimetype = file.mimetype || "";
    if (mimetype === "application/pdf") {
      return cb(null, true);
    }
    cb(new Error("Only PDF files are allowed"));
  },
});

export default uploadPdf;
