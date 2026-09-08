import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { sendError, AppError } from "../utils/errors";
import type { Dataset } from "../types";

// In-memory dataset store (replace with DB in production)
const datasetStore = new Map<string, Dataset>();
const analysisStore = new Map<string, any>();

export async function uploadDataset(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const { originalname, size, mimetype, buffer } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    if (![".csv", ".pcap", ".pcapng"].includes(ext)) {
      throw new AppError("Unsupported file type. Accepted: CSV, PCAP", 400);
    }

    const datasetId = uuidv4();
    
    // Save file temporarily for analysis
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const tempFilePath = path.join(uploadsDir, `${datasetId}${ext}`);
    fs.writeFileSync(tempFilePath, buffer);

    const dataset: Dataset = {
      id: datasetId,
      filename: originalname,
      type: ext.replace(".", ""),
      uploadedAt: new Date().toISOString(),
      rows: 0,
      hosts: 0,
      edges: 0,
      status: "uploaded",
      filePath: tempFilePath,
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

    // Check if already analyzed
    if (analysisStore.has(datasetId)) {
      const cachedResults = analysisStore.get(datasetId);
      return res.json({ success: true, message: "Analysis retrieved from cache", analysis: cachedResults, dataset });
    }

    // Update status
    dataset.status = "processing";

    // Run Python attack detector (quick analyzer for large files)
    const pythonScript = path.join(__dirname, "../..", "ml-service", "analyzer", "quick_analyzer.py");
    const filePath = dataset.filePath;

    if (!filePath || !fs.existsSync(filePath)) {
      throw new AppError("Dataset file not found", 404);
    }

    // Execute Python script with 10,000 row sample
    const pythonProcess = spawn("python", [pythonScript, filePath, "10000"]);
    
    let outputData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python script error:", errorData);
        dataset.status = "error";
        return res.status(500).json({ error: "Analysis failed", details: errorData });
      }

      try {
        const analysisResults = JSON.parse(outputData);
        
        // Update dataset with results
        dataset.rows = analysisResults.total_records || 0;
        dataset.hosts = analysisResults.benign_count || 0;
        dataset.edges = analysisResults.attack_count || 0;
        dataset.status = "analyzed";

        // Store analysis results
        analysisStore.set(datasetId, analysisResults);
        datasetStore.set(datasetId, dataset);

        res.json({ 
          success: true, 
          message: "Analysis complete", 
          dataset,
          analysis: analysisResults
        });
      } catch (parseError) {
        console.error("Failed to parse Python output:", outputData);
        dataset.status = "error";
        res.status(500).json({ error: "Failed to parse analysis results" });
      }
    });

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

export async function downloadReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { format } = req.query;
    
    const analysis = analysisStore.get(id);
    if (!analysis) throw new AppError("Analysis not found. Please analyze the dataset first.", 404);

    const dataset = datasetStore.get(id);
    const filename = dataset?.filename || "attack_report";

    if (format === "json") {
      // JSON download
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}_report.json"`);
      res.json(analysis);
    } else if (format === "csv" || format === "excel") {
      // CSV/Excel download
      const rows = [];
      
      // Summary section
      rows.push(["ATTACK ANALYSIS REPORT"]);
      rows.push(["Generated:", new Date().toISOString()]);
      rows.push(["Dataset:", filename]);
      rows.push([""]);
      rows.push(["SUMMARY"]);
      rows.push(["Total Records", analysis.total_records]);
      rows.push(["Benign Traffic", analysis.benign_count, `${(100 - analysis.attack_percentage).toFixed(2)}%`]);
      rows.push(["Attack Traffic", analysis.attack_count, `${analysis.attack_percentage}%`]);
      rows.push([""]);
      
      // Attack breakdown
      rows.push(["ATTACK BREAKDOWN"]);
      rows.push(["Attack Type", "Count", "Percentage"]);
      
      for (const [attackType, data] of Object.entries(analysis.attack_breakdown || {})) {
        const attackData = data as any;
        rows.push([attackType, attackData.count, `${attackData.percentage}%`]);
      }
      
      rows.push([""]);
      rows.push(["DETAILED ATTACK RECORDS (Sample)"]);
      rows.push(["Row Number", "Attack Type", "Details"]);
      
      // Attack details
      for (const detail of (analysis.attack_details || []).slice(0, 100)) {
        const detailStr = JSON.stringify(detail).substring(0, 200);
        rows.push([detail.row_number, detail.attack_type, detailStr]);
      }

      // Convert to CSV
      const csvContent = rows.map(row => row.join(",")).join("\n");
      
      if (format === "excel") {
        res.setHeader("Content-Type", "application/vnd.ms-excel");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}_report.csv"`);
      } else {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}_report.csv"`);
      }
      
      res.send(csvContent);
    } else {
      throw new AppError("Invalid format. Use: json, csv, or excel", 400);
    }
  } catch (err) {
    sendError(res, err);
  }
}
