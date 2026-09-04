# CyberPredict — AI-Based Network Attack Forecasting System

> **SIH26153 Research Prototype**  
> Problem Statement: *AI-Based Network Attack Forecasting from Network Traffic Data*

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Motivation](#2-motivation)
3. [Existing Limitation of Current Tools](#3-existing-limitation)
4. [Proposed Solution](#4-proposed-solution)
5. [System Architecture](#5-system-architecture)
6. [Data Flow](#6-data-flow)
7. [Graph Representation](#7-graph-representation)
8. [Temporal Learning](#8-temporal-learning)
9. [Multi-Horizon Forecasting](#9-multi-horizon-forecasting)
10. [Attack-Path Forecasting](#10-attack-path-forecasting)
11. [Explainability](#11-explainability)
12. [SOC Dashboard](#12-soc-dashboard)
13. [Demo Scenario](#13-demo-scenario)
14. [Installation](#14-installation)
15. [Running the Frontend](#15-running-the-frontend)
16. [Running the Backend](#16-running-the-backend)
17. [Running the ML Service](#17-running-the-ml-service)
18. [Running with Docker](#18-running-with-docker)
19. [What is Currently Simulated](#19-what-is-currently-simulated)
20. [Future Work — Temporal GNN](#20-future-work)

---

## 1. Problem Statement

Modern Security Operations Centers face a fundamental reactive gap: traditional intrusion detection systems identify attacks only after malicious patterns are matched against traffic. By the time an alert fires, lateral movement may already be underway.

**SIH26153** asks: *can we predict attack behavior from network traffic before it manifests as an incident?*

---

## 2. Motivation

Network communication is not random — it follows patterns. Hosts establish predictable communication topologies, and attackers must deviate from these baselines to achieve their objectives. Reconnaissance, initial access, and lateral movement leave structural and behavioral traces in the communication graph before the final payload executes.

The key insight: **the communication graph evolves**, and its evolution contains predictive signal.

---

## 3. Existing Limitation

| Approach | Limitation |
|----------|-----------|
| Signature-based IDS | Reactive — detects known patterns after the fact |
| Anomaly detection (per-flow) | Treats each flow independently — misses structural patterns |
| ML classifiers on flows | Feature-level, no graph topology, no temporal context |
| Graph-based detection | Captures topology but static — no temporal forecasting |

All existing tools answer: **"Is this malicious right now?"**

CyberPredict asks: **"What is likely to happen next?"**

---

## 4. Proposed Solution

**Observe → Learn → Forecast → Explain → Warn**

CyberPredict:

1. Converts network traffic into an **evolving communication graph**
2. Applies a **Graph Neural Network** to encode spatial topology
3. Applies a **Temporal Encoder** to learn behavioral evolution over time
4. Produces **multi-horizon risk forecasts** (H1, H2, H3 future windows)
5. Predicts the most likely **attack path** through the network
6. Generates **explainable** feature importance for every forecast
7. Presents everything in a **SOC dashboard** with actionable alerts

---

## 5. System Architecture

```
Network Traffic
      ↓
Traffic Preprocessing       ← pandas, NumPy, scikit-learn
      ↓
Evolving Network Graph       ← PyTorch Geometric, GraphBuilder
      ↓
Spatial GNN Encoder          ← GCN / GraphSAGE / GAT  [PLANNED]
      ↓
Temporal Encoder             ← GRU / Transformer / TGN  [PLANNED]
      ↓
Multi-Horizon Forecasting    ← Linear decoder + sigmoid  [PLANNED]
      ↓
Attack Path Forecast         ← Graph attention + beam search  [PLANNED]
      ↓
Explainability               ← GNNExplainer / SHAP  [PLANNED]
      ↓
SOC Dashboard                ← Next.js, React Flow, Recharts  [IMPLEMENTED]
```

---

## 6. Data Flow

```
CSV / PCAP upload
      ↓ (Frontend: Traffic Analyzer page)
Column mapping + validation
      ↓
GraphBuilder.build_sequence()
      ↓ groups flows into time windows
GraphSnapshot[] = [G_1, G_2, ..., G_T]
      ↓
POST /predict  (ML Service)
      ↓
MockPredictor.predict()  ← currently
  (or TemporalGNNPredictor once trained)
      ↓
ForecastResult { risk, horizons, stage, target, path, explanation }
      ↓
Express Backend API → Frontend
      ↓
SOC Dashboard, Network Graph, Attack Forecast, Explainability pages
```

---

## 7. Graph Representation

Each time window produces a `GraphSnapshot`:

**Nodes** — unique hosts (identified by IP address)
- Node features: in-degree, out-degree, risk_score, behavior_change, suspicious_connections

**Edges** — source → destination per window
- Edge features: packet_count, byte_count, protocol, port, connection_frequency, risk_score

A sequence `[G_1, G_2, ..., G_T]` captures how the communication topology evolves over time.

```
Window 1 → G_1  (baseline)
Window 2 → G_2  (scan begins)
Window 3 → G_3  (lateral edges appear)
Window 4 → G_4  (target reached — forecast)
```

---

## 8. Temporal Learning

**(Planned — not yet trained)**

The proposed Temporal GNN processes the graph sequence:

```
[h_1, h_2, ..., h_T]  ← GNN embeddings per snapshot
         ↓
  GRU / Transformer     ← temporal context c_T
         ↓
  Forecast head         ← risk_{t+1}, risk_{t+2}, ..., risk_{t+n}
```

Candidates:
- **GCN + GRU** — simple, fast baseline
- **GraphSAGE + GRU** — inductive, handles unseen hosts
- **GAT + Transformer** — attention over both topology and time
- **TGN (Temporal Graph Networks)** — unified spatial-temporal model

---

## 9. Multi-Horizon Forecasting

Instead of a single binary detection, the system predicts risk for **multiple future time windows**:

| Horizon | Meaning | Confidence |
|---------|---------|-----------|
| H1 | Next graph window | Highest |
| H2 | +2 windows | Medium |
| H3 | +3 windows | Lower |

Risk levels: `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`

This gives SOC analysts advance warning proportional to their response time.

---

## 10. Attack-Path Forecasting

Given the predicted node embeddings, the system identifies:

1. **Entry node** — external or highest-risk ingress
2. **Pivot nodes** — intermediate hosts on the predicted path
3. **Target node** — most likely final objective (database, server)

Path probability = product of per-hop confidence scores.

**All path forecasts are probabilistic estimates, not guaranteed routes.**

---

## 11. Explainability

Every forecast includes:

- **Important nodes** — ranked by gradient attribution / attention weight
- **Important edges** — ranked by attention mask
- **Feature importance** — SHAP-style directional values

Direction indicators:
- ↑ Elevated — feature increased significantly above baseline
- ↓ Reduced — feature decreased (e.g., port entropy drop = targeted behavior)

In demo mode: heuristic importance values from `MockPredictor`.  
In model mode: GNNExplainer + SHAP values from trained model.

---

## 12. SOC Dashboard

Pages:

| Page | Description |
|------|-------------|
| Dashboard | Risk metrics, forecast chart, alerts, pipeline status |
| Traffic Analyzer | CSV/PCAP upload, column mapping, graph window config |
| Network Graph | Interactive React Flow graph with risk visualization |
| Attack Forecast | Multi-horizon chart, attack progression timeline |
| Attack Paths | Predicted lateral movement path with per-node evidence |
| Explainability | SHAP-style feature importance, node/edge attribution |
| Research | Model comparison table + radar/bar charts |
| Architecture | Interactive system pipeline diagram |
| Settings | Service URLs, predictor mode, window size |

---

## 13. Demo Scenario

**Simulated Lateral Movement** — pre-loaded without any upload required.

```
T1: External Host → PC-01              (Reconnaissance)
T2: External Host → PC-01 (persist)   (Initial Access)
T3: PC-01 → SERVER-01 (new edge)      (Lateral Movement — inferred)
T4: SERVER-01 → DB-01 (forecast)      (Data Exfiltration — forecast)
```

Risk progression: 24% → 48% → 74% → 86%

All demo data is clearly labelled **SIMULATED ATTACK SCENARIO**.

---

## 14. Installation

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- npm ≥ 9

### Clone / set up

```bash
# Copy environment config
cp .env.example .env

# Install frontend
cd frontend && npm install

# Install backend
cd ../backend && npm install

# Install ML service
cd ../ml-service && pip install -r requirements.txt
```

---

## 15. Running the Frontend

```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

The frontend runs in **demo mode** by default (`NEXT_PUBLIC_DEMO_MODE=true`).  
All pages work immediately without a running backend — using built-in mock data.

---

## 16. Running the Backend

```bash
cd backend
npm run dev
# API available at http://localhost:4000
# Health check: http://localhost:4000/health
```

API endpoints:
```
GET  /health
GET  /api/dashboard
GET  /api/alerts
GET  /api/graph/:id
POST /api/forecast
GET  /api/forecast/:id
POST /api/upload
POST /api/upload/analyze
GET  /api/attack-path/:id
GET  /api/explanation/:id
```

---

## 17. Running the ML Service

```bash
cd ml-service
python app.py
# Service available at http://localhost:8000
# API docs: http://localhost:8000/docs
```

Endpoints:
```
GET  /health
POST /predict          ← main forecast endpoint
POST /graph/build      ← build graph from raw flows
GET  /graph/{id}       ← get graph snapshot
GET  /explanation/{id} ← get forecast explanation
```

To switch to model mode (once trained):
```bash
PREDICTOR_MODE=model MODEL_CHECKPOINT_PATH=models/checkpoints/temporal_gnn.pt python app.py
```

---

## 18. Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
# ML Svc:   http://localhost:8000
```

---

## 19. What is Currently Simulated

| Component | Status | Notes |
|-----------|--------|-------|
| SOC Dashboard | ✅ Implemented | Full UI with mock data |
| Network Graph | ✅ Implemented | React Flow, interactive |
| Traffic Analyzer | ✅ Implemented | CSV upload + parsing |
| Column mapping | ✅ Implemented | Auto-detect + manual override |
| Backend API | ✅ Implemented | Express, all endpoints |
| ML Service structure | ✅ Implemented | FastAPI, modular predictors |
| MockPredictor | ✅ Implemented | Heuristic scoring, full output |
| Graph builder | ✅ Implemented | Flow → GraphSnapshot |
| GNN encoder | 🔬 Placeholder | Architecture sketched, not trained |
| Temporal encoder | 🔬 Placeholder | Architecture sketched, not trained |
| Forecast head | 🔬 Placeholder | Heuristic projection currently |
| Attack path (model) | 🔬 Placeholder | Greedy heuristic currently |
| Explainability (SHAP) | 🔬 Placeholder | Heuristic importance currently |
| Database persistence | ⬜ Optional | In-memory store; DB schema ready |

**All current forecast values are generated by `MockPredictor` using heuristic rules.**  
They are clearly labelled "Demo Forecast Mode" throughout the UI.

---

## 20. Future Work

To replace `MockPredictor` with `TemporalGNNPredictor`:

1. **Dataset** — obtain labeled network flow dataset:
   - CICIDS2017, CICIDS2018
   - NF-ToN-IoT
   - UNSW-NB15
   - Or capture custom traffic

2. **Preprocessing** — run `GraphBuilder.build_sequence()` over the dataset

3. **Training** — implement `train.py`:
   - GNN layer: `torch_geometric.nn.SAGEConv` or `GATConv`
   - Temporal layer: `torch.nn.GRU` or `torch.nn.TransformerEncoder`
   - Loss: binary cross-entropy for attack/non-attack + MSE for risk regression
   - Evaluation: precision, recall, F1, ROC-AUC, lead-time

4. **Checkpoint** — save trained weights to `models/checkpoints/temporal_gnn.pt`

5. **Integration** — set `PREDICTOR_MODE=model` and implement `TemporalGNNPredictor.load_checkpoint()`

6. **No frontend/backend changes needed** — the predictor interface is already abstracted.

---

## Project Structure

```
cyberpredict/
├── frontend/                   # Next.js 14 + TypeScript + Tailwind
│   ├── app/                    # App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/          # SOC Dashboard
│   │   ├── network-graph/      # Interactive graph
│   │   ├── traffic-analyzer/   # CSV upload
│   │   ├── attack-forecast/    # Forecast + progression
│   │   ├── attack-paths/       # Attack path visualization
│   │   ├── explainability/     # SHAP feature importance
│   │   ├── research/           # Model comparison
│   │   ├── architecture/       # Pipeline diagram
│   │   └── settings/
│   ├── components/             # Reusable components
│   ├── lib/                    # mockData, api, utils
│   └── types/                  # TypeScript types
│
├── backend/                    # Express.js + TypeScript
│   └── src/
│       ├── routes/             # API route definitions
│       ├── controllers/        # Request handlers
│       ├── services/           # Business logic
│       └── utils/              # Errors, mock data
│
├── ml-service/                 # Python FastAPI
│   ├── app.py                  # FastAPI application
│   ├── models/
│   │   ├── base_predictor.py   # Abstract interface
│   │   ├── mock_predictor.py   # Heuristic demo predictor
│   │   └── temporal_gnn.py     # Placeholder (training pending)
│   ├── services/
│   │   ├── graph_builder.py    # Flow → GraphSnapshot
│   │   ├── forecasting.py      # Predictor orchestration
│   │   └── explainability.py   # Explanation generation
│   └── schemas/                # Pydantic data models
│
├── data/demo/                  # Sample traffic CSV
├── docker-compose.yml
├── .env.example
└── README.md
```

---

*CyberPredict — SIH26153 Research Prototype*  
*Predict cyberattacks before they become incidents.*
