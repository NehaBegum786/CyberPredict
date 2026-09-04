"""
MockPredictor — heuristic-based demo predictor.

Generates plausible forecast outputs using rule-based scoring.
Does NOT use any trained ML model.

This predictor:
  - Scores nodes by connection frequency + suspicious flag
  - Projects multi-horizon risk with a configurable growth rate
  - Selects the highest-risk node as the candidate attack target
  - Builds an attack path by following the highest-risk edges
  - Generates illustrative feature importance values

Replace this with TemporalGNNPredictor once the model is trained.
"""

import uuid
import math
import random
from datetime import datetime
from typing import List, Optional

from models.base_predictor import BasePredictor
from schemas import (
    GraphSnapshot, ForecastResult, HorizonForecast,
    AttackPath, AttackPathNode,
    ExplanationResult, ImportantNode, ImportantEdge, FeatureImportance,
)


def _risk_level(score: float) -> str:
    if score < 0.3:  return "LOW"
    if score < 0.6:  return "MEDIUM"
    if score < 0.8:  return "HIGH"
    return "CRITICAL"


class MockPredictor(BasePredictor):
    """
    Heuristic mock predictor for demonstration purposes.

    All outputs are derived from simple rules applied to the graph structure.
    They are illustrative — not the output of a trained model.
    """

    @property
    def mode(self) -> str:
        return "demo"

    # ─── Core predict ──────────────────────────────────────────────────────────

    def predict(
        self,
        graph_sequence: List[GraphSnapshot],
        horizons: int = 3,
        include_explanation: bool = True,
        include_attack_path: bool = True,
    ) -> ForecastResult:
        if not graph_sequence:
            raise ValueError("graph_sequence must contain at least one snapshot")

        current_graph = graph_sequence[-1]

        # 1. Compute current risk
        current_risk = self._compute_graph_risk(current_graph)

        # 2. Multi-horizon forecast
        forecast_horizons = self._project_horizons(current_risk, horizons, graph_sequence)

        # 3. Identify predicted stage
        predicted_stage = self._infer_attack_stage(current_graph, current_risk)

        # 4. Identify likely target
        target_node = self._identify_target(current_graph)

        # 5. Build attack path
        attack_path: Optional[AttackPath] = None
        if include_attack_path:
            attack_path = self._build_attack_path(current_graph, target_node)

        # 6. Compute explanation
        explanation: Optional[ExplanationResult] = None
        forecast_id = str(uuid.uuid4())
        if include_explanation:
            explanation = self._build_explanation(current_graph, forecast_id)

        # 7. Compute confidence
        confidence = self._compute_confidence(current_graph, graph_sequence)

        # 8. Trend
        trend = self._compute_trend(graph_sequence)

        return ForecastResult(
            id=forecast_id,
            dataset_id=current_graph.dataset_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            mode="demo",
            current_risk=round(current_risk, 3),
            current_risk_level=_risk_level(current_risk),
            forecast=forecast_horizons,
            predicted_stage=predicted_stage,
            target=target_node,
            path=self._get_path_labels(attack_path) if attack_path else [],
            path_probability=round(attack_path.probability, 3) if attack_path else 0.0,
            confidence=round(confidence, 3),
            trend=trend,
            attack_path=attack_path,
            explanation=explanation,
        )

    # ─── Risk scoring ──────────────────────────────────────────────────────────

    def _compute_graph_risk(self, graph: GraphSnapshot) -> float:
        """
        Heuristic graph-level risk score in [0, 1].

        Factors:
          - Fraction of suspicious nodes
          - Fraction of suspicious edges
          - Max node risk score
          - Average suspicious connection ratio
        """
        if not graph.nodes:
            return 0.0

        suspicious_nodes = sum(1 for n in graph.nodes if n.is_suspicious)
        suspicious_edges = sum(1 for e in graph.edges if e.is_suspicious)

        frac_sus_nodes = suspicious_nodes / max(len(graph.nodes), 1)
        frac_sus_edges = suspicious_edges / max(len(graph.edges), 1) if graph.edges else 0.0
        max_node_risk  = max((n.risk_score for n in graph.nodes), default=0.0)
        avg_behavior   = sum(n.behavior_change for n in graph.nodes) / max(len(graph.nodes), 1) / 100.0

        risk = (
            0.30 * frac_sus_nodes +
            0.25 * frac_sus_edges +
            0.30 * max_node_risk  +
            0.15 * min(avg_behavior, 1.0)
        )
        return min(max(risk, 0.0), 1.0)

    def _project_horizons(
        self,
        current_risk: float,
        horizons: int,
        sequence: List[GraphSnapshot],
    ) -> List[HorizonForecast]:
        """
        Project risk for H1..Hn using exponential growth with decay.
        Growth rate is estimated from the sequence length and current risk.
        """
        n = len(sequence)
        # Growth rate: faster growth at higher current risk
        growth_rate = 0.10 + 0.08 * current_risk + (0.02 * n)

        results = []
        for h in range(1, horizons + 1):
            projected = current_risk * math.exp(growth_rate * h)
            projected = min(projected, 0.97)
            # Confidence decreases with horizon distance
            confidence = max(0.95 - (h - 1) * 0.08, 0.50)
            results.append(HorizonForecast(
                horizon=h,
                risk=round(projected, 3),
                label=f"H{h} ({'next window' if h == 1 else f'+{h} windows'})",
                confidence=round(confidence, 3),
            ))
        return results

    # ─── Attack stage inference ────────────────────────────────────────────────

    STAGE_THRESHOLDS = [
        (0.80, "Data Exfiltration"),
        (0.65, "Lateral Movement"),
        (0.45, "Initial Access"),
        (0.25, "Reconnaissance"),
        (0.00, "Normal Behavior"),
    ]

    def _infer_attack_stage(self, graph: GraphSnapshot, risk: float) -> str:
        for threshold, stage in self.STAGE_THRESHOLDS:
            if risk >= threshold:
                return stage
        return "Normal Behavior"

    # ─── Target identification ─────────────────────────────────────────────────

    def _identify_target(self, graph: GraphSnapshot) -> str:
        """
        Identify the most likely attack target as the highest-risk
        non-entry, non-external node.
        """
        candidates = [
            n for n in graph.nodes
            if n.type not in ("external",) and n.risk_score > 0.3
        ]
        if not candidates:
            return "Unknown"

        # Prefer servers and databases over generic hosts
        priority_types = {"database": 3, "server": 2, "host": 1}
        candidates.sort(
            key=lambda n: (priority_types.get(n.type, 0), n.risk_score),
            reverse=True,
        )
        return candidates[0].label

    # ─── Attack path ───────────────────────────────────────────────────────────

    def _build_attack_path(
        self, graph: GraphSnapshot, target_label: str
    ) -> AttackPath:
        """
        Build a candidate attack path by:
        1. Identifying the entry node (external / highest outbound risk)
        2. Following the highest-risk edges toward the target
        3. Terminating at the identified target node
        """
        nodes_by_id = {n.id: n for n in graph.nodes}

        # Entry: external node or highest risk node
        external = [n for n in graph.nodes if n.type == "external"]
        entry = max(external, key=lambda n: n.risk_score) if external else max(graph.nodes, key=lambda n: n.risk_score)

        # Target node
        target_nodes = [n for n in graph.nodes if n.label == target_label]
        target = target_nodes[0] if target_nodes else min(graph.nodes, key=lambda n: n.risk_score)

        # BFS-like path from entry to target via highest-risk edges
        path_node_ids = self._find_path(graph, entry.id, target.id)

        path_nodes = []
        for i, nid in enumerate(path_node_ids):
            node = nodes_by_id.get(nid)
            if not node:
                continue
            is_entry  = i == 0
            is_target = i == len(path_node_ids) - 1
            prob = max(0.50, entry.risk_score - i * 0.06)
            path_nodes.append(AttackPathNode(
                id=node.id,
                label=node.label,
                reason=self._node_reason(node, is_entry, is_target),
                probability=round(prob, 3),
                is_entry=is_entry,
                is_target=is_target,
            ))

        path_prob = path_nodes[-1].probability if path_nodes else 0.5
        forecast_id = str(uuid.uuid4())

        return AttackPath(
            id=str(uuid.uuid4()),
            forecast_id=forecast_id,
            nodes=path_nodes,
            probability=round(path_prob, 3),
            potential_target=target_label,
        )

    def _find_path(
        self, graph: GraphSnapshot, start_id: str, end_id: str
    ) -> List[str]:
        """Simple greedy path: follow highest-risk edges from start to end."""
        if start_id == end_id:
            return [start_id]

        # Build adjacency: source -> [(target, risk_score)]
        adj: dict[str, list] = {}
        for e in graph.edges:
            adj.setdefault(e.source, []).append((e.target, e.risk_score))

        visited = {start_id}
        path = [start_id]
        current = start_id

        for _ in range(len(graph.nodes)):
            neighbors = sorted(adj.get(current, []), key=lambda x: -x[1])
            advanced = False
            for nxt, _ in neighbors:
                if nxt not in visited:
                    path.append(nxt)
                    visited.add(nxt)
                    current = nxt
                    advanced = True
                    if nxt == end_id:
                        return path
                    break
            if not advanced:
                break

        # Ensure target is in path
        if end_id not in path:
            path.append(end_id)

        return path

    def _node_reason(self, node, is_entry: bool, is_target: bool) -> str:
        if is_entry:
            return f"Entry point — {node.type} with high-frequency outbound activity and elevated risk score ({node.risk_score:.2f})."
        if is_target:
            return f"Predicted final target — {node.type} node following compromise trajectory in graph evolution."
        return f"Pivot node — anomalous lateral connections observed; behavior change +{node.behavior_change:.0f}% above baseline."

    def _get_path_labels(self, path: Optional[AttackPath]) -> List[str]:
        if not path:
            return []
        return [n.label for n in path.nodes]

    # ─── Explanation ───────────────────────────────────────────────────────────

    def _build_explanation(
        self, graph: GraphSnapshot, forecast_id: str
    ) -> ExplanationResult:
        # Important nodes: top 3 by risk score
        top_nodes = sorted(graph.nodes, key=lambda n: -n.risk_score)[:3]
        important_nodes = [
            ImportantNode(
                node_id=n.id,
                label=n.label,
                importance=round(min(n.risk_score + 0.05, 1.0), 3),
                reason=self._node_reason(n, n.type == "external", False),
            )
            for n in top_nodes
        ]

        # Important edges: suspicious ones, by risk score
        sus_edges = sorted(
            [e for e in graph.edges if e.is_suspicious],
            key=lambda e: -e.risk_score,
        )[:3]
        src_map = {n.id: n.label for n in graph.nodes}
        important_edges = [
            ImportantEdge(
                edge_id=e.id,
                source=src_map.get(e.source, e.source),
                target=src_map.get(e.target, e.target),
                importance=round(e.risk_score, 3),
                reason=f"Suspicious {e.protocol}/{e.port} connection — {e.packet_count:,} packets, risk {e.risk_score:.2f}.",
            )
            for e in sus_edges
        ]

        # Feature importance: deterministic heuristic values
        feature_importance = [
            FeatureImportance(feature="Connection Frequency",   value=0.89, direction="up",   description="Connections/window significantly above baseline."),
            FeatureImportance(feature="Packet Rate",            value=0.82, direction="up",   description="Packets/sec well above baseline for this host pair."),
            FeatureImportance(feature="New Communication Edge", value=0.78, direction="up",   description="New edges not present in previous graph snapshots."),
            FeatureImportance(feature="Destination Diversity",  value=0.71, direction="up",   description="Host communicating with more unique destinations."),
            FeatureImportance(feature="Traffic Volume",         value=0.65, direction="up",   description="Total byte transfer substantially increased."),
            FeatureImportance(feature="Protocol Distribution",  value=0.54, direction="up",   description="Shift toward high-risk protocol usage."),
            FeatureImportance(feature="Temporal Pattern",       value=0.47, direction="up",   description="Off-peak hour activity correlates with attack indicators."),
            FeatureImportance(feature="Port Entropy",           value=0.38, direction="down", description="Decrease in port diversity — targeted behavior."),
        ]

        sus_nodes = sum(1 for n in graph.nodes if n.is_suspicious)
        summary = (
            f"Forecast identifies elevated risk based on {sus_nodes} suspicious node(s) and "
            f"{len(sus_edges)} suspicious edge(s) in the current graph snapshot. "
            f"Key signals: connection frequency increase, new lateral edges, and protocol distribution shift."
        )

        return ExplanationResult(
            id=str(uuid.uuid4()),
            forecast_id=forecast_id,
            summary=summary,
            important_nodes=important_nodes,
            important_edges=important_edges,
            feature_importance=feature_importance,
        )

    # ─── Confidence & trend ───────────────────────────────────────────────────

    def _compute_confidence(
        self, graph: GraphSnapshot, sequence: List[GraphSnapshot]
    ) -> float:
        """
        Confidence increases with more graph snapshots and clearer suspicious signals.
        """
        base = 0.65
        seq_bonus = min(len(sequence) * 0.04, 0.20)
        sus_bonus = min(
            sum(1 for n in graph.nodes if n.is_suspicious) * 0.03, 0.15
        )
        return min(base + seq_bonus + sus_bonus, 0.95)

    def _compute_trend(self, sequence: List[GraphSnapshot]) -> str:
        if len(sequence) < 2:
            return "stable"
        risks = [self._compute_graph_risk(g) for g in sequence[-3:]]
        if len(risks) < 2:
            return "stable"
        delta = risks[-1] - risks[0]
        if delta > 0.05:  return "increasing"
        if delta < -0.05: return "decreasing"
        return "stable"
