import type {
  DashboardStats, ForecastResult, GraphSnapshot,
  NetworkNode, NetworkEdge,
} from "../types";

export const MOCK_NODES: NetworkNode[] = [
  { id: "ext-host-1", label: "External Host", ip: "203.0.113.42",  type: "external", riskScore: 0.91, riskLevel: "CRITICAL", connections: 8,  suspiciousConnections: 7, behaviorChange: 92, isSuspicious: true },
  { id: "pc-01",      label: "PC-01",          ip: "192.168.1.10",  type: "host",     riskScore: 0.74, riskLevel: "HIGH",     connections: 23, suspiciousConnections: 4, behaviorChange: 37, isSuspicious: true },
  { id: "server-01",  label: "SERVER-01",       ip: "192.168.1.100", type: "server",   riskScore: 0.84, riskLevel: "HIGH",     connections: 31, suspiciousConnections: 6, behaviorChange: 58, isSuspicious: true },
  { id: "db-01",      label: "DB-01",           ip: "192.168.1.200", type: "database", riskScore: 0.45, riskLevel: "MEDIUM",   connections: 12, suspiciousConnections: 1, behaviorChange: 12 },
  { id: "router-01",  label: "ROUTER-01",       ip: "192.168.1.1",   type: "router",   riskScore: 0.31, riskLevel: "LOW",      connections: 45, suspiciousConnections: 2, behaviorChange: 8  },
  { id: "iot-01",     label: "IoT-01",          ip: "192.168.1.55",  type: "iot",      riskScore: 0.22, riskLevel: "LOW",      connections: 7,  suspiciousConnections: 0, behaviorChange: 3  },
];

export const MOCK_EDGES: NetworkEdge[] = [
  { id: "e1", source: "ext-host-1", target: "pc-01",     packetCount: 2341, byteCount: 4892031, protocol: "TCP", port: 443,  connectionFrequency: 47, riskScore: 0.89, isSuspicious: true  },
  { id: "e2", source: "pc-01",      target: "server-01", packetCount: 891,  byteCount: 1203041, protocol: "TCP", port: 445,  connectionFrequency: 23, riskScore: 0.81, isSuspicious: true  },
  { id: "e3", source: "server-01",  target: "db-01",     packetCount: 342,  byteCount: 892010,  protocol: "TCP", port: 5432, connectionFrequency: 12, riskScore: 0.62, isSuspicious: false },
  { id: "e4", source: "router-01",  target: "server-01", packetCount: 4502, byteCount: 8921034, protocol: "TCP", port: 80,   connectionFrequency: 89, riskScore: 0.21, isSuspicious: false },
  { id: "e5", source: "router-01",  target: "iot-01",    packetCount: 201,  byteCount: 45023,   protocol: "UDP", port: 8883, connectionFrequency: 9,  riskScore: 0.15, isSuspicious: false },
];

export const MOCK_GRAPH_SNAPSHOT: GraphSnapshot = {
  id: "snap-001",
  datasetId: "demo",
  timestamp: new Date().toISOString(),
  windowIndex: 3,
  nodes: MOCK_NODES,
  edges: MOCK_EDGES,
};

export const MOCK_FORECAST: ForecastResult = {
  id: "forecast-001",
  datasetId: "demo",
  timestamp: new Date().toISOString(),
  mode: "demo",
  currentRisk: 0.48,
  currentRiskLevel: "MEDIUM",
  forecast: [
    { horizon: 1, risk: 0.61, label: "H1 (next window)", confidence: 0.91 },
    { horizon: 2, risk: 0.74, label: "H2 (+2 windows)",  confidence: 0.84 },
    { horizon: 3, risk: 0.86, label: "H3 (+3 windows)",  confidence: 0.76 },
  ],
  predictedStage: "Lateral Movement",
  target: "SERVER-01",
  path: ["External Host", "PC-01", "SERVER-01", "DB-01"],
  pathProbability: 0.78,
  confidence: 0.87,
  trend: "increasing",
};

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  networkRisk: 82,
  networkRiskLevel: "HIGH",
  activeHosts: 128,
  suspiciousEdges: 14,
  forecastAlerts: 7,
  lastUpdated: new Date().toISOString(),
  forecastMode: "demo",
};

export const MOCK_ATTACK_PATH = {
  id: "path-001",
  forecastId: "forecast-001",
  nodes: [
    { id: "ext-host-1", label: "External Host", reason: "Entry point — high-frequency outbound scan behavior.", probability: 0.94, isEntry: true  },
    { id: "pc-01",      label: "PC-01",          reason: "Pivot host — receives anomalous volume; new SMB lateral traffic.", probability: 0.88 },
    { id: "server-01",  label: "SERVER-01",       reason: "High-value target receiving unexpected SMB connections from PC-01.", probability: 0.81 },
    { id: "db-01",      label: "DB-01",           reason: "Final-stage target; database follows server compromise trajectory.", probability: 0.78, isTarget: true },
  ],
  probability: 0.78,
  potentialTarget: "DB-01",
};

export const MOCK_EXPLANATION = {
  id: "exp-001",
  forecastId: "forecast-001",
  summary: "Increasing lateral movement risk based on abnormal cross-segment traffic. Key signals: SMB port activity from PC-01 and high-frequency scan from external host.",
  importantNodes: [
    { nodeId: "server-01",  label: "SERVER-01",     importance: 0.84, reason: "Central target — receives anomalous connections not in baseline." },
    { nodeId: "pc-01",      label: "PC-01",          importance: 0.67, reason: "Pivot host — unusual traffic volume and new connection patterns." },
    { nodeId: "ext-host-1", label: "External Host",  importance: 0.91, reason: "Entry point — scan-like behavior escalated sharply." },
  ],
  importantEdges: [
    { edgeId: "e2", source: "PC-01",          target: "SERVER-01", importance: 0.81, reason: "Edge appeared in window T2 with rapid packet volume escalation." },
    { edgeId: "e1", source: "External Host",  target: "PC-01",     importance: 0.76, reason: "Sustained high-frequency with suspicious port targeting." },
  ],
  featureImportance: [
    { feature: "Connection Frequency",  value: 0.89, direction: "up",   description: "Connections/window well above baseline." },
    { feature: "Packet Rate",           value: 0.82, direction: "up",   description: "Packets/sec significantly above baseline." },
    { feature: "New Communication Edge",value: 0.78, direction: "up",   description: "New edges not in prior graph snapshots." },
    { feature: "Destination Diversity", value: 0.71, direction: "up",   description: "PC-01 communicating with more unique hosts." },
    { feature: "Traffic Volume",        value: 0.65, direction: "up",   description: "Byte transfer increased substantially." },
    { feature: "Protocol Distribution", value: 0.54, direction: "up",   description: "Shift toward SMB/445 — atypical for segment." },
    { feature: "Temporal Pattern",      value: 0.47, direction: "up",   description: "Off-peak hour activity correlation." },
    { feature: "Port Entropy",          value: 0.38, direction: "down", description: "Reduced port diversity — targeted behavior." },
  ],
};

export const MOCK_ALERTS = [
  {
    id: "alert-001", severity: "HIGH",     title: "Lateral Movement Risk Increasing",
    description: "Increasing malicious lateral interaction predicted.",
    potentialTarget: "SERVER-01", predictedStage: "Lateral Movement",
    confidence: 0.87, forecastHorizon: "H2", timestamp: new Date(Date.now() - 120000).toISOString(),
    forecastId: "forecast-001", isRead: false,
  },
  {
    id: "alert-002", severity: "CRITICAL", title: "High-Risk Path to Database",
    description: "Attack path forecast reaches DB-01 with 78% probability.",
    potentialTarget: "DB-01", predictedStage: "Data Exfiltration",
    confidence: 0.78, forecastHorizon: "H3", timestamp: new Date(Date.now() - 60000).toISOString(),
    forecastId: "forecast-001", isRead: false,
  },
  {
    id: "alert-003", severity: "MEDIUM",   title: "External Scan Activity",
    description: "External host showing reconnaissance behavior.",
    potentialTarget: "PC-01", predictedStage: "Reconnaissance",
    confidence: 0.92, forecastHorizon: "H1", timestamp: new Date(Date.now() - 300000).toISOString(),
    forecastId: "forecast-001", isRead: true,
  },
];
