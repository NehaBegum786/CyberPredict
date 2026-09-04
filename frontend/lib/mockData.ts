import type {
  DashboardStats,
  ForecastResult,
  GraphSnapshot,
  AttackPath,
  ExplanationResult,
  ForecastAlert,
  ModelComparison,
  DemoScenario,
  NetworkNode,
  NetworkEdge,
  AttackProgressionStage,
} from "@/types";

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  networkRisk: 82,
  networkRiskLevel: "HIGH",
  activeHosts: 128,
  suspiciousEdges: 14,
  forecastAlerts: 7,
  lastUpdated: new Date().toISOString(),
  forecastMode: "demo",
};

// ─── Network Nodes ────────────────────────────────────────────────────────────

export const MOCK_NODES: NetworkNode[] = [
  {
    id: "ext-host-1",
    label: "External Host",
    ip: "203.0.113.42",
    type: "external",
    riskScore: 0.91,
    riskLevel: "CRITICAL",
    connections: 8,
    suspiciousConnections: 7,
    behaviorChange: 92,
    isSuspicious: true,
    x: 400,
    y: 80,
  },
  {
    id: "pc-01",
    label: "PC-01",
    ip: "192.168.1.10",
    type: "host",
    riskScore: 0.74,
    riskLevel: "HIGH",
    connections: 23,
    suspiciousConnections: 4,
    behaviorChange: 37,
    isSuspicious: true,
    x: 400,
    y: 220,
  },
  {
    id: "server-01",
    label: "SERVER-01",
    ip: "192.168.1.100",
    type: "server",
    riskScore: 0.84,
    riskLevel: "HIGH",
    connections: 31,
    suspiciousConnections: 6,
    behaviorChange: 58,
    isSuspicious: true,
    x: 400,
    y: 360,
  },
  {
    id: "db-01",
    label: "DB-01",
    ip: "192.168.1.200",
    type: "database",
    riskScore: 0.45,
    riskLevel: "MEDIUM",
    connections: 12,
    suspiciousConnections: 1,
    behaviorChange: 12,
    x: 400,
    y: 500,
  },
  {
    id: "router-01",
    label: "ROUTER-01",
    ip: "192.168.1.1",
    type: "router",
    riskScore: 0.31,
    riskLevel: "LOW",
    connections: 45,
    suspiciousConnections: 2,
    behaviorChange: 8,
    x: 200,
    y: 280,
  },
  {
    id: "iot-01",
    label: "IoT-01",
    ip: "192.168.1.55",
    type: "iot",
    riskScore: 0.22,
    riskLevel: "LOW",
    connections: 7,
    suspiciousConnections: 0,
    behaviorChange: 3,
    x: 600,
    y: 280,
  },
];

export const MOCK_EDGES: NetworkEdge[] = [
  {
    id: "e1",
    source: "ext-host-1",
    target: "pc-01",
    packetCount: 2341,
    byteCount: 4892031,
    protocol: "TCP",
    port: 443,
    connectionFrequency: 47,
    riskScore: 0.89,
    isSuspicious: true,
  },
  {
    id: "e2",
    source: "pc-01",
    target: "server-01",
    packetCount: 891,
    byteCount: 1203041,
    protocol: "TCP",
    port: 445,
    connectionFrequency: 23,
    riskScore: 0.81,
    isSuspicious: true,
  },
  {
    id: "e3",
    source: "server-01",
    target: "db-01",
    packetCount: 342,
    byteCount: 892010,
    protocol: "TCP",
    port: 5432,
    connectionFrequency: 12,
    riskScore: 0.62,
    isSuspicious: false,
  },
  {
    id: "e4",
    source: "router-01",
    target: "server-01",
    packetCount: 4502,
    byteCount: 8921034,
    protocol: "TCP",
    port: 80,
    connectionFrequency: 89,
    riskScore: 0.21,
    isSuspicious: false,
  },
  {
    id: "e5",
    source: "router-01",
    target: "iot-01",
    packetCount: 201,
    byteCount: 45023,
    protocol: "UDP",
    port: 8883,
    connectionFrequency: 9,
    riskScore: 0.15,
    isSuspicious: false,
  },
];

// ─── Graph Snapshot ───────────────────────────────────────────────────────────

export const MOCK_GRAPH_SNAPSHOT: GraphSnapshot = {
  id: "snap-001",
  datasetId: "demo",
  timestamp: new Date().toISOString(),
  windowIndex: 3,
  nodes: MOCK_NODES,
  edges: MOCK_EDGES,
};

// ─── Forecast ─────────────────────────────────────────────────────────────────

export const MOCK_FORECAST: ForecastResult = {
  id: "forecast-001",
  datasetId: "demo",
  timestamp: new Date().toISOString(),
  mode: "demo",
  currentRisk: 0.48,
  currentRiskLevel: "MEDIUM",
  forecast: [
    { horizon: 1, risk: 0.61, label: "H1 (next window)", confidence: 0.91 },
    { horizon: 2, risk: 0.74, label: "H2 (+2 windows)", confidence: 0.84 },
    { horizon: 3, risk: 0.86, label: "H3 (+3 windows)", confidence: 0.76 },
  ],
  predictedStage: "Lateral Movement",
  target: "SERVER-01",
  path: ["External Host", "PC-01", "SERVER-01", "DB-01"],
  pathProbability: 0.78,
  confidence: 0.87,
  trend: "increasing",
};

// ─── Attack Path ──────────────────────────────────────────────────────────────

export const MOCK_ATTACK_PATH: AttackPath = {
  id: "path-001",
  forecastId: "forecast-001",
  nodes: [
    {
      id: "ext-host-1",
      label: "External Host",
      reason: "Initiating host with high-frequency outbound scan behavior and known suspicious IP range.",
      probability: 0.94,
      isEntry: true,
    },
    {
      id: "pc-01",
      label: "PC-01",
      reason: "Receives anomalous traffic volume from external host; sudden spike in lateral protocol usage (SMB/445).",
      probability: 0.88,
    },
    {
      id: "server-01",
      label: "SERVER-01",
      reason: "High-value server receiving unexpected SMB connections from PC-01 — consistent with lateral movement pattern.",
      probability: 0.81,
    },
    {
      id: "db-01",
      label: "DB-01",
      reason: "Final-stage target; database access follows server compromise in observed lateral movement scenarios.",
      probability: 0.78,
      isTarget: true,
    },
  ],
  probability: 0.78,
  potentialTarget: "DB-01",
};

// ─── Explanation ──────────────────────────────────────────────────────────────

export const MOCK_EXPLANATION: ExplanationResult = {
  id: "exp-001",
  forecastId: "forecast-001",
  summary:
    "The forecast identifies increasing lateral movement risk based on observed abnormal cross-segment traffic patterns. Key indicators include a sudden rise in SMB port activity from PC-01 and high-frequency scan patterns originating from the external host.",
  importantNodes: [
    {
      nodeId: "server-01",
      label: "SERVER-01",
      importance: 0.84,
      reason: "Central target of lateral movement; receives anomalous connections not present in baseline behavior.",
    },
    {
      nodeId: "pc-01",
      label: "PC-01",
      importance: 0.67,
      reason: "Acts as intermediate pivot host; unusual traffic volume and new connection patterns observed.",
    },
    {
      nodeId: "ext-host-1",
      label: "External Host",
      importance: 0.91,
      reason: "Entry point; scan-like behavior and connection frequency sharply increased in recent graph windows.",
    },
  ],
  importantEdges: [
    {
      edgeId: "e2",
      source: "PC-01",
      target: "SERVER-01",
      importance: 0.81,
      reason: "This edge appeared for the first time in window T2 and shows rapid escalation in packet volume.",
    },
    {
      edgeId: "e1",
      source: "External Host",
      target: "PC-01",
      importance: 0.76,
      reason: "Sustained high-frequency connection with suspicious port targeting pattern.",
    },
  ],
  featureImportance: [
    { feature: "Connection Frequency", value: 0.89, direction: "up", description: "Number of connections per unit time has significantly increased." },
    { feature: "Packet Rate", value: 0.82, direction: "up", description: "Packets per second well above baseline for this host pair." },
    { feature: "New Communication Edge", value: 0.78, direction: "up", description: "New edges not present in previous graph snapshots have appeared." },
    { feature: "Destination Diversity", value: 0.71, direction: "up", description: "PC-01 is now communicating with more unique destinations than baseline." },
    { feature: "Traffic Volume", value: 0.65, direction: "up", description: "Total byte transfer has increased substantially across suspicious edges." },
    { feature: "Protocol Distribution", value: 0.54, direction: "up", description: "Shift towards SMB/445 usage — not typical for this host segment." },
    { feature: "Temporal Pattern", value: 0.47, direction: "up", description: "Activity during off-peak hours correlates with attack indicators." },
    { feature: "Port Entropy", value: 0.38, direction: "down", description: "Decrease in port diversity suggests targeted rather than scan behavior." },
  ],
};

// ─── Attack Progression ───────────────────────────────────────────────────────

export const MOCK_ATTACK_PROGRESSION: AttackProgressionStage[] = [
  {
    stage: "Reconnaissance",
    status: "observed",
    description: "External host performing systematic port scanning and service enumeration.",
    indicators: ["High connection frequency", "Port scan pattern", "ICMP probes"],
    timestamp: "T1",
  },
  {
    stage: "Initial Access",
    status: "observed",
    description: "Successful connection established from external host to PC-01 via TCP/443.",
    indicators: ["Sustained TCP session", "Payload size increase", "Session persistence"],
    timestamp: "T2",
  },
  {
    stage: "Lateral Movement",
    status: "inferred",
    description: "PC-01 initiating SMB connections to SERVER-01 — consistent with lateral movement.",
    indicators: ["SMB/445 traffic", "New cross-segment edges", "Credential-like behavior"],
    timestamp: "T3 (current)",
  },
  {
    stage: "Privilege Escalation",
    status: "forecast",
    description: "Forecast: Potential privilege escalation attempt on SERVER-01 based on trajectory.",
    indicators: ["Predicted from graph evolution pattern"],
  },
  {
    stage: "Data Exfiltration",
    status: "forecast",
    description: "Forecast: DB-01 may be targeted following SERVER-01 compromise.",
    indicators: ["Predicted path includes DB-01"],
  },
];

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const MOCK_ALERTS: ForecastAlert[] = [
  {
    id: "alert-001",
    severity: "HIGH",
    title: "Lateral Movement Risk Increasing",
    description: "Increasing malicious lateral interaction predicted based on evolving graph behavior.",
    potentialTarget: "SERVER-01",
    predictedStage: "Lateral Movement",
    confidence: 0.87,
    forecastHorizon: "H2",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    forecastId: "forecast-001",
    isRead: false,
  },
  {
    id: "alert-002",
    severity: "CRITICAL",
    title: "High-Risk Path to Database Detected",
    description: "Attack path forecast reaches DB-01 with 78% path probability.",
    potentialTarget: "DB-01",
    predictedStage: "Data Exfiltration",
    confidence: 0.78,
    forecastHorizon: "H3",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    forecastId: "forecast-001",
    isRead: false,
  },
  {
    id: "alert-003",
    severity: "MEDIUM",
    title: "External Scan Activity Detected",
    description: "External host showing reconnaissance behavior towards internal segment.",
    potentialTarget: "PC-01",
    predictedStage: "Reconnaissance",
    confidence: 0.92,
    forecastHorizon: "H1",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    forecastId: "forecast-001",
    isRead: true,
  },
];

// ─── Model Comparison ─────────────────────────────────────────────────────────

export const MOCK_MODEL_COMPARISONS: ModelComparison[] = [
  {
    modelName: "Logistic Regression",
    category: "Baseline",
    metrics: {
      precision: 0.71,
      recall: 0.63,
      f1: 0.67,
      fpr: 0.18,
      prAuc: 0.69,
      rocAuc: 0.74,
      leadTime: "0 windows (reactive)",
      hitsAtK: 0.52,
    },
    isIllustrative: true,
    description: "Simple linear classifier on flow-level features. Reactive — detects after attack occurs.",
  },
  {
    modelName: "Random Forest",
    category: "Baseline",
    metrics: {
      precision: 0.79,
      recall: 0.72,
      f1: 0.75,
      fpr: 0.12,
      prAuc: 0.78,
      rocAuc: 0.82,
      leadTime: "0 windows (reactive)",
      hitsAtK: 0.64,
    },
    isIllustrative: true,
    description: "Ensemble classifier on traffic features. Better precision but still reactive detection.",
  },
  {
    modelName: "LSTM",
    category: "Sequential",
    metrics: {
      precision: 0.81,
      recall: 0.76,
      f1: 0.78,
      fpr: 0.10,
      prAuc: 0.82,
      rocAuc: 0.86,
      leadTime: "+1 window",
      hitsAtK: 0.71,
    },
    isIllustrative: true,
    description: "Recurrent network on temporal traffic features. Captures time patterns but ignores graph topology.",
  },
  {
    modelName: "GraphSAGE",
    category: "Graph-based",
    metrics: {
      precision: 0.84,
      recall: 0.79,
      f1: 0.81,
      fpr: 0.08,
      prAuc: 0.85,
      rocAuc: 0.89,
      leadTime: "+1 window",
      hitsAtK: 0.77,
    },
    isIllustrative: true,
    description: "Graph neural network capturing spatial topology. Better at detecting structural anomalies.",
  },
  {
    modelName: "Temporal GNN (proposed)",
    category: "Proposed",
    metrics: {
      precision: null,
      recall: null,
      f1: null,
      fpr: null,
      prAuc: null,
      rocAuc: null,
      leadTime: "+2–3 windows (forecast)",
      hitsAtK: null,
    },
    isIllustrative: false,
    description: "Proposed model combining GNN spatial encoding + temporal encoder for multi-horizon forecasting. Model training in progress — results pending.",
  },
];

// ─── Demo Scenario ────────────────────────────────────────────────────────────

export const DEMO_SCENARIO: DemoScenario = {
  id: "lateral-movement-demo",
  name: "Simulated Lateral Movement",
  description:
    "A simulated network attack scenario demonstrating reconnaissance, initial access, and lateral movement through an internal network segment. For demonstration purposes only.",
  totalDuration: 45,
  steps: [
    {
      step: 1,
      label: "T1 — Reconnaissance",
      description: "External host begins scanning internal network. Graph shows first suspicious connections.",
      risk: 0.24,
      stage: "Reconnaissance",
      newEdges: ["e1"],
      graph: {
        id: "snap-t1",
        datasetId: "demo",
        timestamp: "T1",
        windowIndex: 0,
        nodes: [
          { id: "ext-host-1", label: "External Host", ip: "203.0.113.42", type: "external", riskScore: 0.45, riskLevel: "MEDIUM", connections: 3, suspiciousConnections: 3, behaviorChange: 45, isSuspicious: true, x: 400, y: 80 },
          { id: "pc-01", label: "PC-01", ip: "192.168.1.10", type: "host", riskScore: 0.22, riskLevel: "LOW", connections: 8, suspiciousConnections: 1, behaviorChange: 15, x: 400, y: 220 },
          { id: "router-01", label: "ROUTER-01", ip: "192.168.1.1", type: "router", riskScore: 0.15, riskLevel: "LOW", connections: 30, suspiciousConnections: 0, behaviorChange: 3, x: 200, y: 280 },
        ],
        edges: [
          { id: "e1", source: "ext-host-1", target: "pc-01", packetCount: 241, byteCount: 48920, protocol: "TCP", port: 443, connectionFrequency: 12, riskScore: 0.52, isSuspicious: true },
        ],
      },
    },
    {
      step: 2,
      label: "T2 — Initial Access",
      description: "External host establishes persistent connection to PC-01. Risk increases.",
      risk: 0.48,
      stage: "Initial Access",
      newEdges: ["e1-escalated"],
      graph: {
        id: "snap-t2",
        datasetId: "demo",
        timestamp: "T2",
        windowIndex: 1,
        nodes: [
          { id: "ext-host-1", label: "External Host", ip: "203.0.113.42", type: "external", riskScore: 0.72, riskLevel: "HIGH", connections: 6, suspiciousConnections: 6, behaviorChange: 72, isSuspicious: true, x: 400, y: 80 },
          { id: "pc-01", label: "PC-01", ip: "192.168.1.10", type: "host", riskScore: 0.54, riskLevel: "MEDIUM", connections: 14, suspiciousConnections: 3, behaviorChange: 37, isSuspicious: true, x: 400, y: 220 },
          { id: "server-01", label: "SERVER-01", ip: "192.168.1.100", type: "server", riskScore: 0.31, riskLevel: "LOW", connections: 18, suspiciousConnections: 0, behaviorChange: 8, x: 400, y: 360 },
          { id: "router-01", label: "ROUTER-01", ip: "192.168.1.1", type: "router", riskScore: 0.15, riskLevel: "LOW", connections: 35, suspiciousConnections: 0, behaviorChange: 3, x: 200, y: 280 },
        ],
        edges: [
          { id: "e1", source: "ext-host-1", target: "pc-01", packetCount: 1241, byteCount: 1489200, protocol: "TCP", port: 443, connectionFrequency: 34, riskScore: 0.78, isSuspicious: true },
          { id: "e-router-srv", source: "router-01", target: "server-01", packetCount: 2100, byteCount: 4100000, protocol: "TCP", port: 80, connectionFrequency: 60, riskScore: 0.18, isSuspicious: false },
        ],
      },
    },
    {
      step: 3,
      label: "T3 — Lateral Movement",
      description: "PC-01 begins SMB connections to SERVER-01. New edge appears — lateral movement inferred.",
      risk: 0.74,
      stage: "Lateral Movement",
      newEdges: ["e2"],
      graph: MOCK_GRAPH_SNAPSHOT,
    },
  ],
};

// ─── Risk Timeline Data (for Recharts) ───────────────────────────────────────

export const RISK_TIMELINE_DATA = [
  { time: "02:00", risk: 12, label: "Baseline" },
  { time: "02:30", risk: 15, label: "Normal" },
  { time: "03:00", risk: 18, label: "Normal" },
  { time: "03:15", risk: 24, label: "T1 Start" },
  { time: "03:30", risk: 31, label: "Scan" },
  { time: "03:45", risk: 38, label: "Scan+" },
  { time: "04:00", risk: 48, label: "T2 Access" },
  { time: "04:15", risk: 54, label: "Persist" },
  { time: "04:30", risk: 62, label: "T3 Lateral" },
  { time: "04:45", risk: 74, label: "Current" },
];

export const FORECAST_CHART_DATA = [
  { label: "Current", risk: 48, type: "observed", confidence: 1.0 },
  { label: "H1", risk: 61, type: "forecast", confidence: 0.91 },
  { label: "H2", risk: 74, type: "forecast", confidence: 0.84 },
  { label: "H3", risk: 86, type: "forecast", confidence: 0.76 },
];
