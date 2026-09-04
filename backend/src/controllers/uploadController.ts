import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { sendError, AppError } from "../utils/errors";
import type { Dataset } from "../types";

// In-memory dataset store (replace with DB in production)
const datasetStore = new Map<string, Dataset>();

export async function uploadDataset(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const { originalname, size, mimetype } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    if (![".csv", ".pcap", ".pcapng"].includes(ext)) {
      throw new AppError("Unsupported file type. Accepted: CSV, PCAP", 400);
    }

    const dataset: Dataset = {
      id: uuidv4(),
      filename: originalname,
      type: ext.replace(".", ""),
      uploadedAt: new Date().toISOString(),
      rows: 0,           // populated after analysis
      hosts: 0,
      edges: 0,
      status: "uploaded",
    };

    datasetStore.set(dataset.id, dataset);

    res.status(201).json(dataset);
  } catch (err) {
    sendError(res, err);
  }
}

export async function analyzeDataset(req: Request, res: Response): Promise<void> {
  try {
    const { datasetId } = req.body as { datasetId?: string };
    if (!datasetId) throw new AppError("datasetId required", 400);

    const dataset = datasetStore.get(datasetId);
    if (!dataset) throw new AppError("Dataset not found", 404);

    // Simulate analysis processing
    dataset.status = "processing";
    await new Promise((r) => setTimeout(r, 500));

    // Mock analysis results
    dataset.rows = Math.floor(Math.random() * 20000) + 5000;
    dataset.hosts = Math.floor(Math.random() * 100) + 20;
    dataset.edges = Math.floor(Math.random() * 3000) + 500;
    dataset.timeStart = "02:00:00";
    dataset.timeEnd = "06:00:00";
    dataset.status = "analyzed";

    datasetStore.set(datasetId, dataset);
    res.json({ success: true, message: "Analysis complete", dataset });
  } catch (err) {
    sendError(res, err);
  }
}

export async function getDataset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const dataset = datasetStore.get(id);
    if (!dataset) throw new AppError("Dataset not found", 404);
    res.json(dataset);
  } catch (err) {
    sendError(res, err);
  }
}

export async function listDatasets(_req: Request, res: Response): Promise<void> {
  try {
    res.json(Array.from(datasetStore.values()));
  } catch (err) {
    sendError(res, err);
  }
}
