// ─── Risk & Status Enums ──────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type NodeType = "host" | "server" | "database" | "router" | "iot" | "external";
export type AttackStage = "Reconnaissance" | "Initial Access" | "Lateral Movement" | "Privilege Escalation" | "Data Exfiltration" | "Command & Control";
export type StageStatus = "observed" | "inferred" | "forecast" | "none";
export type ForecastMode = "demo" | "model";

// ─── Network Graph Types ──────────────────────────────────────────────────────

export interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  type: NodeType;
  riskScore: number;
  riskLevel: RiskLevel;
  connections: number;
  suspiciousConnections: number;
  behaviorChange: number; // percentage change
  isCompromised?: boolean;
  isSuspicious?: boolean;
  x?: number;
  y?: number;
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
  timestamp?: string;
}

export interface GraphSnapshot {
  id: string;
  datasetId: string;
  timestamp: string;
  windowIndex: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// ─── Forecast Types ───────────────────────────────────────────────────────────

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
  predictedStage: AttackStage;
  target: string;
  path: string[];
  pathProbability: number;
  confidence: number;
  trend: "increasing" | "stable" | "decreasing";
}

// ─── Attack Path Types ────────────────────────────────────────────────────────

export interface AttackPathNode {
  id: string;
  label: string;
  reason: string;
  probability: number;
  isEntry?: boolean;
  isTarget?: boolean;
}

export interface AttackPath {
  id: string;
  forecastId: string;
  nodes: AttackPathNode[];
  probability: number;
  potentialTarget: string;
}

// ─── Attack Progression ───────────────────────────────────────────────────────

export interface AttackProgressionStage {
  stage: AttackStage;
  status: StageStatus;
  description: string;
  indicators?: string[];
  timestamp?: string;
}

// ─── Explainability Types ─────────────────────────────────────────────────────

export interface ImportantNode {
  nodeId: string;
  label: string;
  importance: number;
  reason: string;
}

export interface ImportantEdge {
  edgeId: string;
  source: string;
  target: string;
  importance: number;
  reason: string;
}

export interface FeatureImportance {
  feature: string;
  value: number;
  direction: "up" | "down" | "neutral";
  description: string;
}

export interface ExplanationResult {
  id: string;
  forecastId: string;
  summary: string;
  importantNodes: ImportantNode[];
  importantEdges: ImportantEdge[];
  featureImportance: FeatureImportance[];
}

// ─── Dataset / Upload Types ───────────────────────────────────────────────────

export interface Dataset {
  id: string;
  filename: string;
  type: "csv" | "pcap";
  uploadedAt: string;
  rows: number;
  hosts: number;
  edges: number;
  timeStart?: string;
  timeEnd?: string;
  status: "uploaded" | "processing" | "analyzed" | "error";
}

export interface ColumnMapping {
  datasetColumn: string;
  systemField: string;
}

export interface TrafficFlow {
  id: string;
  datasetId: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  packets: number;
  bytes: number;
  duration: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  networkRisk: number;
  networkRiskLevel: RiskLevel;
  activeHosts: number;
  suspiciousEdges: number;
  forecastAlerts: number;
  lastUpdated: string;
  forecastMode: ForecastMode;
}

// ─── Alert Types ──────────────────────────────────────────────────────────────

export interface ForecastAlert {
  id: string;
  severity: RiskLevel;
  title: string;
  description: string;
  potentialTarget: string;
  predictedStage: AttackStage;
  confidence: number;
  forecastHorizon: string;
  timestamp: string;
  forecastId: string;
  isRead: boolean;
}

// ─── Research / Model Comparison ─────────────────────────────────────────────

export interface ModelMetrics {
  precision: number | null;
  recall: number | null;
  f1: number | null;
  fpr: number | null;
  prAuc: number | null;
  rocAuc: number | null;
  leadTime: string | null;
  hitsAtK: number | null;
}

export interface ModelComparison {
  modelName: string;
  category: string;
  metrics: ModelMetrics;
  isIllustrative: boolean;
  description: string;
}

// ─── Demo Scenario Types ──────────────────────────────────────────────────────

export interface DemoTimeStep {
  step: number;
  label: string;
  description: string;
  graph: GraphSnapshot;
  risk: number;
  stage: AttackStage;
  newEdges: string[];
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  steps: DemoTimeStep[];
  totalDuration: number; // seconds
}
