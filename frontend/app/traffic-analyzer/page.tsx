"use client";

import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
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

    const sizeKB = file.size / 1024;
    const fileSize = sizeKB > 1024
      ? `${(sizeKB / 1024).toFixed(1)} MB`
      : `${sizeKB.toFixed(1)} KB`;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 200, // read first 200 rows for demo
      complete: (results) => {
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

        setDataset({
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
        });
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
    setAnalyzing(true);
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 2200));
    setAnalyzing(false);
    setAnalyzed(true);
  };

  const handleReset = () => {
    setStatus("idle");
    setDataset(null);
    setError(null);
    setAnalyzed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                disabled={!dataset.mapping.src_ip || !dataset.mapping.dst_ip}
                icon={<Activity className="w-4 h-4" />}
              >
                {analyzing ? "Building graph & running forecast…" : "Analyze Dataset & Generate Forecast"}
              </Button>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-blue-300">Analysis complete</p>
                  <p className="text-xs text-slate-400">
                    Graph snapshots built · Demo forecast generated · Attack path estimated
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
          )}
        </>
      )}
    </div>
  );
}
