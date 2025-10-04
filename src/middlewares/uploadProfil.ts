import multer from "multer";
import path from "path";
import fs from "fs";

// On crée le dossier s'il n'existe pas
const uploadDir = path.join(__dirname, "../uploads/profile");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadProfil = multer({ storage });

export default uploadProfil;
