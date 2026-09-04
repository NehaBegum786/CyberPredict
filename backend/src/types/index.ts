export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ForecastMode = "demo" | "model";

export interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  type: string;
  riskScore: number;
  riskLevel: RiskLevel;
  connections: number;
  suspiciousConnections: number;
  behaviorChange: number;
  isSuspicious?: boolean;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  packetCount: number;
  byteCount: number;
  protocol: string;
  port: number;
  connectionFrequency: number;
  riskScore: number;
  isSuspicious?: boolean;
}

export interface GraphSnapshot {
  id: string;
  datasetId: string;
  timestamp: string;
  windowIndex: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface HorizonForecast {
  horizon: number;
  risk: number;
  label: string;
  confidence: number;
}

export interface ForecastResult {
  id: string;
  datasetId: string;
  timestamp: string;
  mode: ForecastMode;
  currentRisk: number;
  currentRiskLevel: RiskLevel;
  forecast: HorizonForecast[];
  predictedStage: string;
  target: string;
  path: string[];
  pathProbability: number;
  confidence: number;
  trend: string;
}

export interface DashboardStats {
  networkRisk: number;
  networkRiskLevel: RiskLevel;
  activeHosts: number;
  suspiciousEdges: number;
  forecastAlerts: number;
  lastUpdated: string;
  forecastMode: ForecastMode;
}

export interface Dataset {
  id: string;
  filename: string;
  type: string;
  uploadedAt: string;
  rows: number;
  hosts: number;
  edges: number;
  timeStart?: string;
  timeEnd?: string;
  status: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
