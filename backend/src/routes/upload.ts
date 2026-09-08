import { Router } from "express";
import multer from "multer";
import path from "path";
import { uploadDataset, analyzeDataset, getDataset, listDatasets, downloadReport } from "../controllers/uploadController";

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [".csv", ".pcap", ".pcapng"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only CSV and PCAP are accepted."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

const router = Router();

router.post("/",         upload.single("file"), uploadDataset);
router.post("/analyze",  analyzeDataset);
router.get("/",          listDatasets);
router.get("/:id",       getDataset);
router.get("/:id/download", downloadReport);

export default router;
