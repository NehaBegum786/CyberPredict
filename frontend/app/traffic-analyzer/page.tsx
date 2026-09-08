"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Server,
  Activity,
  Database,
  RefreshCw,
  ArrowRight,
  Info,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { storage } from "@/lib/storage";

// ─── Column mapping ───────────────────────────────────────────────────────────

const SYSTEM_FIELDS = [
  { key: "src_ip",    label: "Source IP",       required: true  },
  { key: "dst_ip",    label: "Destination IP",  required: true  },
  { key: "src_port",  label: "Source Port",     required: false },
  { key: "dst_port",  label: "Destination Port",required: false },
  { key: "protocol",  label: "Protocol",        required: false },
  { key: "timestamp", label: "Timestamp",       required: false },
  { key: "packets",   label: "Packets",         required: false },
  { key: "bytes",     label: "Bytes",           required: false },
  { key: "duration",  label: "Duration",        required: false },
];

// Common column name aliases for auto-detection
const COLUMN_ALIASES: Record<string, string[]> = {
  src_ip:    ["src_ip","source_ip","src ip","source ip","srcip","src","source","sip","ip_src"],
  dst_ip:    ["dst_ip","destination_ip","dst ip","dest ip","dstip","dst","dest","destination","dip","ip_dst"],
  src_port:  ["src_port","sport","source_port","srcport","src port"],
  dst_port:  ["dst_port","dport","dest_port","dstport","dst port","destination_port"],
  protocol:  ["protocol","proto","prot"],
  timestamp: ["timestamp","time","ts","datetime","date_time","flow_start"],
  packets:   ["packets","pkts","pkt_count","tot_pkts","total_packets"],
  bytes:     ["bytes","tot_bytes","total_bytes","flow_bytes","bytecount"],
  duration:  ["duration","flow_duration","dur"],
};

function autoDetectMapping(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lowerCols = columns.map((c) => c.toLowerCase().trim());
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = lowerCols.indexOf(alias);
      if (idx !== -1) { mapping[field] = columns[idx]; break; }
    }
  }
  return mapping;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedDataset {
  id: string;
  filename: string;
  rows: number;
  columns: string[];
  preview: Record<string, string>[];
  mapping: Record<string, string>;
  hosts: number;
  edges: number;
  timeStart?: string;
  timeEnd?: string;
  fileSize: string;
  fileId?: string; // IndexedDB file reference
}

type UploadStatus = "idle" | "parsing" | "mapping" | "ready" | "error";

const WINDOW_SIZES = ["1 min", "5 min", "10 min", "30 min"];

export default function TrafficAnalyzerPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [windowSize, setWindowSize] = useState("5 min");
  const [showPreview, setShowPreview] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [backendDatasetId, setBackendDatasetId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedFileRef = useRef<File | null>(null);

  // Initialize IndexedDB storage
  useEffect(() => {
    storage.init().then(() => {
      setStorageReady(true);
      console.log("✅ IndexedDB storage initialized");
    }).catch(err => {
      console.error("Failed to initialize storage:", err);
      setStorageReady(true); // Continue without IndexedDB
    });
  }, []);

  // Load saved state from localStorage + IndexedDB
  useEffect(() => {
    if (!storageReady) return;

    const saved = localStorage.getItem("trafficAnalyzerState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.dataset) setDataset(parsed.dataset);
        if (parsed.windowSize) setWindowSize(parsed.windowSize);
        if (parsed.analyzed) setAnalyzed(parsed.analyzed);
        console.log("✅ Restored state from localStorage");
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, [storageReady]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!storageReady) return;

    if (status !== "idle" && status !== "error" && status !== "parsing") {
      const stateToSave = { status, dataset, windowSize, analyzed };
      localStorage.setItem("trafficAnalyzerState", JSON.stringify(stateToSave));
    } else if (status === "idle") {
      localStorage.removeItem("trafficAnalyzerState");
    }
  }, [status, dataset, windowSize, analyzed, storageReady]);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(csv|CSV)$/)) {
      // Accept CSVs only for now; PCAP requires backend
      if (!file.name.match(/\.(pcap|pcapng)$/i)) {
        setError("Please upload a CSV or PCAP file.");
        setStatus("error");
        return;
      }
      setError("PCAP parsing requires the backend service. Please upload a CSV file for client-side demo.");
      setStatus("error");
      return;
    }

    setStatus("parsing");
    setError(null);
    
    // Store file reference for backend upload
    uploadedFileRef.current = file;

    const sizeKB = file.size / 1024;
    const fileSize = sizeKB > 1024
      ? `${(sizeKB / 1024).toFixed(1)} MB`
      : `${sizeKB.toFixed(1)} KB`;

    // Save file to IndexedDB first
    let fileId: string | undefined;
    try {
      fileId = await storage.saveFile(file);
      console.log("✅ File saved to IndexedDB:", fileId);
    } catch (err) {
      console.error("Failed to save file to IndexedDB:", err);
      // Continue without IndexedDB
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 200, // read first 200 rows for demo
      complete: async (results) => {
        const columns = results.meta.fields ?? [];
        if (columns.length === 0) {
          setError("Could not detect columns. Ensure the CSV has a header row.");
          setStatus("error");
          return;
        }

        const mapping = autoDetectMapping(columns);
        const data = results.data as Record<string, string>[];

        // Compute unique hosts and edges from data
        const srcField = mapping.src_ip;
        const dstField = mapping.dst_ip;
        const tsField  = mapping.timestamp;

        const hostSet = new Set<string>();
        const edgeSet = new Set<string>();
        const timestamps: string[] = [];

        data.forEach((row) => {
          const src = srcField ? row[srcField] : null;
          const dst = dstField ? row[dstField] : null;
          const ts  = tsField  ? row[tsField]  : null;
          if (src) hostSet.add(src);
          if (dst) hostSet.add(dst);
          if (src && dst) edgeSet.add(`${src}->${dst}`);
          if (ts) timestamps.push(ts);
        });

        timestamps.sort();

        const datasetId = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDataset: ParsedDataset = {
          id: datasetId,
          filename: file.name,
          rows: data.length,
          columns,
          preview: data.slice(0, 8),
          mapping,
          hosts: hostSet.size,
          edges: edgeSet.size,
          timeStart: timestamps[0],
          timeEnd: timestamps[timestamps.length - 1],
          fileSize,
          fileId,
        };

        // Save dataset metadata to IndexedDB
        try {
          await storage.saveDataset(newDataset);
          console.log("✅ Dataset metadata saved to IndexedDB");
        } catch (err) {
          console.error("Failed to save dataset to IndexedDB:", err);
        }

        setDataset(newDataset);
        setStatus("ready");
      },
      error: (err) => {
        setError(`Parse error: ${err.message}`);
        setStatus("error");
      },
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleAnalyze = async () => {
    if (!uploadedFileRef.current || !dataset) {
      setError("No file uploaded");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      // Step 1: Upload file to backend
      const formData = new FormData();
      formData.append('file', uploadedFileRef.current);
      
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }
      
      const uploadData = await uploadRes.json();
      const datasetId = uploadData.id;
      setBackendDatasetId(datasetId);
      
      // Step 2: Analyze dataset
      const analyzeRes = await fetch(`${API_URL}/api/upload/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId }),
      });
      
      if (!analyzeRes.ok) {
        throw new Error('Analysis failed');
      }
      
      const analyzeData = await analyzeRes.json();
      setAnalysisResults(analyzeData.analysis);
      setAnalyzed(true);
      
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Make sure backend is running on http://localhost:4000');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = async () => {
    setStatus("idle");
    setDataset(null);
    setError(null);
    setAnalyzed(false);
    setAnalysisResults(null);
    setBackendDatasetId(null);
    uploadedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    // Clear IndexedDB storage
    try {
      await storage.clearAll();
      console.log("✅ IndexedDB storage cleared");
    } catch (err) {
      console.error("Failed to clear IndexedDB:", err);
    }
  };

  const handleDownload = async (format: 'csv' | 'excel' | 'json') => {
    if (!backendDatasetId) {
      setError("No dataset ID available");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/upload/${backendDatasetId}/download?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset?.filename || 'attack_report'}_report.${format === 'excel' ? 'csv' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || 'Download failed');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Traffic Analyzer</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-400">
            Upload network traffic data to construct an evolving communication graph and generate forecasts
          </p>
        </div>
        {dataset && (
          <Button variant="ghost" size="sm" onClick={handleReset} icon={<X className="w-4 h-4" />}>
            Clear dataset
          </Button>
        )}
      </div>

      {/* Upload area */}
      {status === "idle" || status === "error" ? (
        <Card>
          <CardContent>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative flex flex-col items-center justify-center gap-4 p-12 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                isDragging
                  ? "border-blue-500/60 bg-blue-500/5"
                  : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.pcap,.pcapng"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className={cn(
                "w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all",
                isDragging ? "border-blue-500/50 bg-blue-500/10" : "border-slate-700 bg-slate-800/50"
              )}>
                <Upload className={cn("w-7 h-7", isDragging ? "text-blue-400" : "text-slate-500")} />
              </div>

              <div className="text-center">
                <p className="text-base font-semibold text-slate-200 mb-1">
                  {isDragging ? "Drop file here" : "Drop network dataset here"}
                </p>
                <p className="text-sm text-slate-500">or click to browse</p>
              </div>

              <div className="flex items-center gap-3">
                {["CSV", "PCAP"].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-400 font-mono"
                  >
                    {fmt}
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-600">
                CSV: fully supported · PCAP: requires backend service
              </p>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Demo dataset note */}
            <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-blue-500/5 border border-blue-500/15 rounded-lg">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                No dataset? Use the{" "}
                <Link href="/dashboard" className="text-blue-400 hover:underline">
                  built-in demo scenario
                </Link>{" "}
                which simulates a lateral movement attack with pre-loaded mock data.
                Supported CSV columns: src_ip, dst_ip, src_port, dst_port, protocol, timestamp, packets, bytes, duration.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : status === "parsing" ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-slate-300 font-medium">Parsing dataset…</p>
            <p className="text-xs text-slate-500">Detecting columns and extracting flow records</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Dataset loaded */}
      {status === "ready" && dataset && (
        <>
          {/* Success banner */}
          <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-300">Dataset loaded successfully</p>
              <p className="text-xs text-slate-400">{dataset.filename} · {dataset.fileSize}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Database,  label: "Flow Records",    value: dataset.rows.toLocaleString() },
              { icon: Server,    label: "Unique Hosts",    value: dataset.hosts.toLocaleString() },
              { icon: Activity,  label: "Comm. Edges",     value: dataset.edges.toLocaleString() },
              { icon: Clock,     label: "Time Range",      value: dataset.timeStart && dataset.timeEnd
                  ? `${dataset.timeStart} – ${dataset.timeEnd}`
                  : "N/A",
                small: true },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className="w-4 h-4 text-slate-500" />
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                </div>
                <p className={cn("font-bold text-white", s.small ? "text-sm" : "text-2xl")}>
                  {s.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Column Mapping */}
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
              <button
                onClick={() => setShowMapping((v) => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {showMapping ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showMapping ? "Hide" : "Show"}
              </button>
            </CardHeader>

            {showMapping && (
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">
                  Auto-detected column mapping. Adjust if incorrect.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-slate-500 py-2 pr-4 font-medium">System Field</th>
                        <th className="text-left text-slate-500 py-2 pr-4 font-medium">Required</th>
                        <th className="text-left text-slate-500 py-2 font-medium">Mapped Column</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SYSTEM_FIELDS.map((field) => {
                        const mapped = dataset.mapping[field.key];
                        return (
                          <tr key={field.key} className="border-b border-slate-800/50">
                            <td className="py-2 pr-4 font-mono text-blue-400">{field.key}</td>
                            <td className="py-2 pr-4">
                              {field.required ? (
                                <span className="text-red-400 font-medium">Required</span>
                              ) : (
                                <span className="text-slate-600">Optional</span>
                              )}
                            </td>
                            <td className="py-2">
                              {mapped ? (
                                <select
                                  value={mapped}
                                  onChange={(e) =>
                                    setDataset((d) =>
                                      d ? { ...d, mapping: { ...d.mapping, [field.key]: e.target.value } } : d
                                    )
                                  }
                                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="">— none —</option>
                                  {dataset.columns.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  value=""
                                  onChange={(e) =>
                                    setDataset((d) =>
                                      d ? { ...d, mapping: { ...d.mapping, [field.key]: e.target.value } } : d
                                    )
                                  }
                                  className="bg-slate-800 border border-red-500/30 rounded px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="">— select column —</option>
                                  {dataset.columns.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}

            {!showMapping && (
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_FIELDS.map((field) => {
                    const mapped = dataset.mapping[field.key];
                    return (
                      <div
                        key={field.key}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs",
                          mapped
                            ? "bg-green-500/5 border-green-500/20 text-green-400"
                            : field.required
                            ? "bg-red-500/5 border-red-500/20 text-red-400"
                            : "bg-slate-800/50 border-slate-700 text-slate-500"
                        )}
                      >
                        <span className="font-mono">{field.key}</span>
                        {mapped ? (
                          <span className="text-slate-400">→ {mapped}</span>
                        ) : (
                          <span className="text-slate-600">{field.required ? "missing" : "—"}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Graph Window Config */}
          <Card>
            <CardHeader>
              <CardTitle>Graph Window Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 mb-3">
                Traffic will be grouped into time windows to build successive graph snapshots G₁ → G₂ → … → Gₜ
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 mr-1">Window size:</span>
                {WINDOW_SIZES.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWindowSize(w)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg border text-xs font-medium transition-all",
                      windowSize === w
                        ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-3">
                Smaller windows capture finer temporal resolution; larger windows reduce noise. 5 min is recommended for most datasets.
              </p>
            </CardContent>
          </Card>

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showPreview ? "Hide" : `Show first ${dataset.preview.length} rows`}
              </button>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {dataset.columns.map((col) => (
                          <th key={col} className="text-left text-slate-500 py-2 pr-4 font-mono font-medium whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.preview.map((row, i) => (
                        <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                          {dataset.columns.map((col) => (
                            <td key={col} className="py-1.5 pr-4 text-slate-300 font-mono whitespace-nowrap max-w-[160px] truncate">
                              {row[col] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Showing first {dataset.preview.length} of {dataset.rows.toLocaleString()} rows
                </p>
              </CardContent>
            )}
          </Card>

          {/* Analyze Button */}
          {!analyzed ? (
            <div className="flex justify-end">
              <Button
                size="lg"
                loading={analyzing}
                onClick={handleAnalyze}
                disabled={analyzing}
                icon={<Activity className="w-4 h-4" />}
              >
                {analyzing ? "Analyzing dataset..." : "Analyze Dataset & Detect Attacks"}
              </Button>
            </div>
          ) : (
            <>
              {/* Analysis Results */}
              {analysisResults && (
                <>
                  {/* Attack Statistics */}
                  <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Attack Detection Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <p className="text-xs text-slate-500 uppercase mb-1">Total Records</p>
                          <p className="text-2xl font-bold text-white">{analysisResults.total_records?.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-xs text-green-400 uppercase mb-1">Benign Traffic</p>
                          <p className="text-2xl font-bold text-green-300">{analysisResults.benign_count?.toLocaleString()}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {(100 - (analysisResults.attack_percentage || 0)).toFixed(1)}%
                          </p>
                        </div>
                        <div className={cn(
                          "text-center p-4 rounded-lg border",
                          analysisResults.attack_percentage < 5 ? "bg-green-500/10 border-green-500/20" :
                          analysisResults.attack_percentage < 15 ? "bg-yellow-500/10 border-yellow-500/20" :
                          analysisResults.attack_percentage < 30 ? "bg-orange-500/10 border-orange-500/20" :
                          "bg-red-500/10 border-red-500/20"
                        )}>
                          <p className={cn(
                            "text-xs uppercase mb-1",
                            analysisResults.attack_percentage < 5 ? "text-green-400" :
                            analysisResults.attack_percentage < 15 ? "text-yellow-400" :
                            analysisResults.attack_percentage < 30 ? "text-orange-400" :
                            "text-red-400"
                          )}>Attacks Detected</p>
                          <p className={cn(
                            "text-2xl font-bold",
                            analysisResults.attack_percentage < 5 ? "text-green-300" :
                            analysisResults.attack_percentage < 15 ? "text-yellow-300" :
                            analysisResults.attack_percentage < 30 ? "text-orange-300" :
                            "text-red-300"
                          )}>{analysisResults.attack_count?.toLocaleString()}</p>
                          <p className="text-xs font-semibold mt-1">
                            {analysisResults.attack_percentage?.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* Attack Breakdown */}
                      {analysisResults.attack_breakdown && Object.keys(analysisResults.attack_breakdown).length > 0 && (
                        <div className="space-y-3 mt-4">
                          <p className="text-sm font-semibold text-slate-300">Attack Type Breakdown:</p>
                          {Object.entries(analysisResults.attack_breakdown).map(([type, data]: [string, any]) => (
                            <div key={type} className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-200 font-medium">{type}</span>
                                <span className="text-slate-400">
                                  {data.count?.toLocaleString()} ({data.percentage?.toFixed(2)}%)
                                </span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                                  style={{ width: `${Math.min(data.percentage || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Download Buttons */}
                      <div className="pt-4 border-t border-slate-700">
                        <p className="text-sm font-semibold text-slate-300 mb-3">Download Report:</p>
                        <div className="flex gap-3 flex-wrap">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Download className="w-4 h-4" />}
                            onClick={() => handleDownload('csv')}
                          >
                            Download CSV
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Download className="w-4 h-4" />}
                            onClick={() => handleDownload('excel')}
                          >
                            Download Excel
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Download className="w-4 h-4" />}
                            onClick={() => handleDownload('json')}
                          >
                            Download JSON
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Next Steps */}
              <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-blue-300">Analysis complete</p>
                    <p className="text-xs text-slate-400">
                      {analysisResults ? `Detected ${analysisResults.attack_count} attacks in ${analysisResults.total_records?.toLocaleString()} records` : 'Results ready'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/network-graph">
                    <Button variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                      View Network Graph
                    </Button>
                  </Link>
                  <Link href="/attack-forecast">
                    <Button size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                      View Attack Forecast
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
