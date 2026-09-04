"""
CyberPredict ML Service — FastAPI application

Endpoints:
    GET  /              — health check
    GET  /health        — detailed health + predictor status
    POST /predict       — run forecast on graph sequence
    POST /graph/build   — build graph sequence from raw flows
    GET  /graph/{id}    — get demo graph snapshot
    GET  /explanation/{forecast_id} — get explanation for a forecast

Predictor modes (set PREDICTOR_MODE env variable):
    demo  → MockPredictor  (default, no training required)
    model → TemporalGNNPredictor (requires trained checkpoint)
"""

import os
import uuid
from datetime import datetime
from typing import List

import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    GraphSnapshot, ForecastResult, ExplanationResult,
    PredictRequest, GraphBuildRequest,
)
from services.forecasting import get_forecasting_service
from services.graph_builder import GraphBuilder
from services.explainability import ExplainabilityService

# ─── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CyberPredict ML Service",
    description=(
        "AI-based network attack forecasting service. "
        "Current mode: Demo (MockPredictor). "
        "Replace PREDICTOR_MODE=model + checkpoint to use TemporalGNNPredictor."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Services ─────────────────────────────────────────────────────────────────

forecasting_service = get_forecasting_service()
graph_builder = GraphBuilder(window_minutes=int(os.getenv("WINDOW_MINUTES", "5")))
explainability_service = ExplainabilityService()

# ─── Demo graph snapshot ──────────────────────────────────────────────────────

DEMO_SNAPSHOT = GraphSnapshot(
    id="snap-demo-001",
    dataset_id="demo",
    timestamp=datetime.utcnow().isoformat() + "Z",
    window_index=3,
    nodes=[
        {"id": "ext-host-1", "label": "External Host", "ip": "203.0.113.42",  "type": "external", "risk_score": 0.91, "risk_level": "CRITICAL", "connections": 8,  "suspicious_connections": 7, "behavior_change": 92.0, "is_suspicious": True},
        {"id": "pc-01",      "label": "PC-01",          "ip": "192.168.1.10",  "type": "host",     "risk_score": 0.74, "risk_level": "HIGH",     "connections": 23, "suspicious_connections": 4, "behavior_change": 37.0, "is_suspicious": True},
        {"id": "server-01",  "label": "SERVER-01",       "ip": "192.168.1.100", "type": "server",   "risk_score": 0.84, "risk_level": "HIGH",     "connections": 31, "suspicious_connections": 6, "behavior_change": 58.0, "is_suspicious": True},
        {"id": "db-01",      "label": "DB-01",           "ip": "192.168.1.200", "type": "database", "risk_score": 0.45, "risk_level": "MEDIUM",   "connections": 12, "suspicious_connections": 1, "behavior_change": 12.0, "is_suspicious": False},
        {"id": "router-01",  "label": "ROUTER-01",       "ip": "192.168.1.1",   "type": "router",   "risk_score": 0.31, "risk_level": "LOW",      "connections": 45, "suspicious_connections": 2, "behavior_change": 8.0,  "is_suspicious": False},
    ],
    edges=[
        {"id": "e1", "source": "ext-host-1", "target": "pc-01",     "packet_count": 2341, "byte_count": 4892031, "protocol": "TCP", "port": 443,  "connection_frequency": 47.0, "risk_score": 0.89, "is_suspicious": True},
        {"id": "e2", "source": "pc-01",      "target": "server-01", "packet_count": 891,  "byte_count": 1203041, "protocol": "TCP", "port": 445,  "connection_frequency": 23.0, "risk_score": 0.81, "is_suspicious": True},
        {"id": "e3", "source": "server-01",  "target": "db-01",     "packet_count": 342,  "byte_count": 892010,  "protocol": "TCP", "port": 5432, "connection_frequency": 12.0, "risk_score": 0.62, "is_suspicious": False},
        {"id": "e4", "source": "router-01",  "target": "server-01", "packet_count": 4502, "byte_count": 8921034, "protocol": "TCP", "port": 80,   "connection_frequency": 89.0, "risk_score": 0.21, "is_suspicious": False},
    ],
)

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "CyberPredict ML Service",
        "version": "1.0.0",
        "status": "ok",
        "predictor": forecasting_service.predictor_name,
        "mode": forecasting_service.mode,
        "note": "Demo Forecast Mode — MockPredictor active. Set PREDICTOR_MODE=model to use TemporalGNNPredictor.",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "predictor": forecasting_service.predictor_name,
        "predictor_ready": True,
        "mode": forecasting_service.mode,
        "window_minutes": graph_builder.window_minutes,
    }


@app.post("/predict", response_model=ForecastResult)
def predict(request: PredictRequest):
    """
    Run a forecast on the provided graph sequence.

    The graph_sequence should be ordered oldest-to-newest.
    The most recent snapshot ([-1]) is treated as current state.

    Returns a ForecastResult with:
      - current_risk: float [0,1]
      - forecast: list of HorizonForecast for H1..Hn
      - predicted_stage: attack stage inference
      - target: likely attack target node
      - path: predicted attack path
      - explanation: SHAP-style feature importance (if requested)
    """
    try:
        result = forecasting_service.predict(
            graph_sequence=request.graph_sequence,
            horizons=request.horizons,
            include_explanation=request.include_explanation,
            include_attack_path=request.include_attack_path,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except NotImplementedError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/graph/build", response_model=List[GraphSnapshot])
def build_graph(request: GraphBuildRequest):
    """
    Build a sequence of graph snapshots from raw flow records.

    Accepts a list of flow dicts with standard field names.
    Returns the list of GraphSnapshot objects for the dataset.
    """
    try:
        builder = GraphBuilder(window_minutes=request.window_size_minutes)
        snapshots = builder.build_sequence(
            flows=request.flows,
            dataset_id=request.dataset_id,
        )
        if not snapshots:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid flows found. Check src_ip and dst_ip fields.",
            )
        return snapshots
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/graph/{dataset_id}", response_model=GraphSnapshot)
def get_graph(dataset_id: str):
    """Return the demo graph snapshot (or a stored snapshot for the given dataset_id)."""
    # TODO: look up stored snapshots from DB by dataset_id
    return DEMO_SNAPSHOT


@app.get("/explanation/{forecast_id}", response_model=ExplanationResult)
def get_explanation(forecast_id: str):
    """
    Return the explanation for a given forecast.
    Currently returns a demo explanation.
    TODO: look up stored explanation by forecast_id.
    """
    from schemas import ImportantNode, ImportantEdge, FeatureImportance
    return ExplanationResult(
        id=str(uuid.uuid4()),
        forecast_id=forecast_id,
        summary="Explanation generated by MockPredictor — illustrative values.",
        important_nodes=[
            ImportantNode(node_id="server-01", label="SERVER-01", importance=0.84, reason="Central target of lateral movement trajectory."),
            ImportantNode(node_id="ext-host-1", label="External Host", importance=0.91, reason="Entry point with scan-like behavior."),
        ],
        important_edges=[
            ImportantEdge(edge_id="e2", source="PC-01", target="SERVER-01", importance=0.81, reason="New lateral edge appeared in window T2."),
        ],
        feature_importance=[
            FeatureImportance(feature="Connection Frequency", value=0.89, direction="up", description="Connections/window above baseline."),
            FeatureImportance(feature="Packet Rate",           value=0.82, direction="up", description="Packets/sec above baseline."),
            FeatureImportance(feature="New Edge Appearance",   value=0.78, direction="up", description="New edges not in prior snapshots."),
        ],
    )


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    print(f"""
  ╔═══════════════════════════════════════════╗
  ║   CyberPredict ML Service                ║
  ║   http://localhost:{port}                  ║
  ║   Predictor: {forecasting_service.predictor_name:<28}║
  ║   Mode: {forecasting_service.mode:<34}║
  ║   Docs: http://localhost:{port}/docs        ║
  ╚═══════════════════════════════════════════╝
    """)
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
