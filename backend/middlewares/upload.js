import multer from "multer";
import path from "path";
import fs from "fs";


const dir = path.join("uploads", "tasks");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/tasks");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // cela veux dire 5mo
});
