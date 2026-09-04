"""
Pydantic schemas for graph data, forecast input/output.
These schemas are shared between the FastAPI app and all predictor modules.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# ─── Graph schemas ─────────────────────────────────────────────────────────────

class NetworkNode(BaseModel):
    id: str
    label: str
    ip: str
    type: str
    risk_score: float = Field(ge=0.0, le=1.0)
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    connections: int = 0
    suspicious_connections: int = 0
    behavior_change: float = 0.0
    is_suspicious: bool = False


class NetworkEdge(BaseModel):
    id: str
    source: str
    target: str
    packet_count: int = 0
    byte_count: int = 0
    protocol: str = "TCP"
    port: int = 0
    connection_frequency: float = 0.0
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    is_suspicious: bool = False


class GraphSnapshot(BaseModel):
    id: str
    dataset_id: str
    timestamp: str
    window_index: int
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]


# ─── Forecast schemas ──────────────────────────────────────────────────────────

class HorizonForecast(BaseModel):
    horizon: int
    risk: float = Field(ge=0.0, le=1.0)
    label: str
    confidence: float = Field(ge=0.0, le=1.0)


class ImportantNode(BaseModel):
    node_id: str
    label: str
    importance: float
    reason: str


class ImportantEdge(BaseModel):
    edge_id: str
    source: str
    target: str
    importance: float
    reason: str


class FeatureImportance(BaseModel):
    feature: str
    value: float
    direction: Literal["up", "down", "neutral"]
    description: str


class AttackPathNode(BaseModel):
    id: str
    label: str
    reason: str
    probability: float
    is_entry: bool = False
    is_target: bool = False


class AttackPath(BaseModel):
    id: str
    forecast_id: str
    nodes: List[AttackPathNode]
    probability: float
    potential_target: str


class ExplanationResult(BaseModel):
    id: str
    forecast_id: str
    summary: str
    important_nodes: List[ImportantNode]
    important_edges: List[ImportantEdge]
    feature_importance: List[FeatureImportance]


class ForecastResult(BaseModel):
    id: str
    dataset_id: str
    timestamp: str
    mode: Literal["demo", "model"]
    current_risk: float
    current_risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    forecast: List[HorizonForecast]
    predicted_stage: str
    target: str
    path: List[str]
    path_probability: float
    confidence: float
    trend: Literal["increasing", "stable", "decreasing"]
    attack_path: Optional[AttackPath] = None
    explanation: Optional[ExplanationResult] = None


# ─── Request schemas ───────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    graph_sequence: List[GraphSnapshot]
    horizons: int = Field(default=3, ge=1, le=5)
    include_explanation: bool = True
    include_attack_path: bool = True


class GraphBuildRequest(BaseModel):
    dataset_id: str
    flows: List[dict]
    window_size_minutes: int = 5
