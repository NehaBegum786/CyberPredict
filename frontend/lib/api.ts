import axios from "axios";
import type {
  DashboardStats,
  ForecastResult,
  GraphSnapshot,
  AttackPath,
  ExplanationResult,
  ForecastAlert,
  Dataset,
} from "@/types";
import {
  MOCK_DASHBOARD_STATS,
  MOCK_FORECAST,
  MOCK_GRAPH_SNAPSHOT,
  MOCK_ATTACK_PATH,
  MOCK_EXPLANATION,
  MOCK_ALERTS,
} from "./mockData";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

// Gracefully fall back to mock data if backend is unavailable
async function safeApiCall<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (DEMO_MODE) return fallback;
  try {
    return await fn();
  } catch {
    console.warn("[CyberPredict] Backend unavailable — using mock data");
    return fallback;
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return safeApiCall(
    async () => (await api.get<DashboardStats>("/api/dashboard")).data,
    MOCK_DASHBOARD_STATS
  );
}

export async function fetchAlerts(): Promise<ForecastAlert[]> {
  return safeApiCall(
    async () => (await api.get<ForecastAlert[]>("/api/alerts")).data,
    MOCK_ALERTS
  );
}

// ─── Graph ────────────────────────────────────────────────────────────────────

export async function fetchGraph(id: string = "demo"): Promise<GraphSnapshot> {
  return safeApiCall(
    async () => (await api.get<GraphSnapshot>(`/api/graph/${id}`)).data,
    MOCK_GRAPH_SNAPSHOT
  );
}

// ─── Forecast ────────────────────────────────────────────────────────────────

export async function fetchForecast(id: string = "demo"): Promise<ForecastResult> {
  return safeApiCall(
    async () => (await api.get<ForecastResult>(`/api/forecast/${id}`)).data,
    MOCK_FORECAST
  );
}

export async function runForecast(payload: {
  graph_sequence: GraphSnapshot[];
  horizons: number;
}): Promise<ForecastResult> {
  return safeApiCall(
    async () => (await api.post<ForecastResult>("/api/forecast", payload)).data,
    MOCK_FORECAST
  );
}

// ─── Attack Path ──────────────────────────────────────────────────────────────

export async function fetchAttackPath(id: string = "demo"): Promise<AttackPath> {
  return safeApiCall(
    async () => (await api.get<AttackPath>(`/api/attack-path/${id}`)).data,
    MOCK_ATTACK_PATH
  );
}

// ─── Explanation ──────────────────────────────────────────────────────────────

export async function fetchExplanation(id: string = "demo"): Promise<ExplanationResult> {
  return safeApiCall(
    async () => (await api.get<ExplanationResult>(`/api/explanation/${id}`)).data,
    MOCK_EXPLANATION
  );
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadDataset(file: File): Promise<Dataset> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<Dataset>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function analyzeDataset(datasetId: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post(`/api/analyze`, { datasetId });
  return res.data;
}
