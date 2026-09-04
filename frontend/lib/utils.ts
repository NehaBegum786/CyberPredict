import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "LOW": return "text-green-400";
    case "MEDIUM": return "text-yellow-400";
    case "HIGH": return "text-red-400";
    case "CRITICAL": return "text-red-600";
    default: return "text-slate-400";
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case "LOW": return "bg-green-500/10 border-green-500/30";
    case "MEDIUM": return "bg-yellow-500/10 border-yellow-500/30";
    case "HIGH": return "bg-red-500/10 border-red-500/30";
    case "CRITICAL": return "bg-red-700/10 border-red-700/30";
    default: return "bg-slate-500/10 border-slate-500/30";
  }
}

export function getRiskHex(level: RiskLevel): string {
  switch (level) {
    case "LOW": return "#22c55e";
    case "MEDIUM": return "#f59e0b";
    case "HIGH": return "#ef4444";
    case "CRITICAL": return "#dc2626";
    default: return "#64748b";
  }
}

export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score < 0.3) return "LOW";
  if (score < 0.6) return "MEDIUM";
  if (score < 0.8) return "HIGH";
  return "CRITICAL";
}

export function formatRiskPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function getStageStatusColor(status: string): string {
  switch (status) {
    case "observed": return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
    case "inferred": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "forecast": return "text-red-400 bg-red-500/10 border-red-500/30";
    default: return "text-slate-500 bg-slate-800/50 border-slate-700/30";
  }
}

export function riskScoreToChartColor(score: number): string {
  if (score < 0.3) return "#22c55e";
  if (score < 0.6) return "#f59e0b";
  if (score < 0.8) return "#ef4444";
  return "#dc2626";
}
