import multer from "multer";
import { env } from "../config/env.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP files are supported."));
    }
    cb(null, true);
  },
});

export const singleImage = upload.single("file");
