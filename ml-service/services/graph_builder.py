"""
GraphBuilder — converts raw traffic flows into graph snapshots.

Pipeline:
    raw flows (CSV rows / dicts)
        ↓ group by time window
        ↓ extract unique hosts → nodes
        ↓ aggregate flow features → edges
        ↓ compute node risk scores
        ↓ GraphSnapshot[]
"""

import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

from schemas import GraphSnapshot, NetworkNode, NetworkEdge


def _risk_level(score: float) -> str:
    if score < 0.3:  return "LOW"
    if score < 0.6:  return "MEDIUM"
    if score < 0.8:  return "HIGH"
    return "CRITICAL"


class GraphBuilder:
    """
    Converts a list of raw traffic flow records into a sequence of
    GraphSnapshot objects, each representing one time window.
    """

    def __init__(self, window_minutes: int = 5):
        self.window_minutes = window_minutes

    def build_sequence(
        self,
        flows: List[Dict[str, Any]],
        dataset_id: str,
        src_field: str = "src_ip",
        dst_field: str = "dst_ip",
        ts_field:  str = "timestamp",
        pkt_field: str = "packets",
        byt_field: str = "bytes",
        proto_field: str = "protocol",
        dport_field: str = "dst_port",
    ) -> List[GraphSnapshot]:
        """
        Build a sequence of graph snapshots from raw flows.

        Parameters
        ----------
        flows : list of dicts
            Each dict is a flow record with at minimum src_ip, dst_ip.
        dataset_id : str
            Identifier for the dataset.
        *_field : str
            Column name mappings for each flow field.

        Returns
        -------
        List[GraphSnapshot]
            Ordered list of snapshots, one per time window.
        """
        if not flows:
            return []

        # Group flows by time window
        windows = self._group_by_window(flows, ts_field)

        snapshots = []
        for window_idx, (window_key, window_flows) in enumerate(sorted(windows.items())):
            snapshot = self._build_snapshot(
                window_flows, dataset_id, window_idx,
                window_key, src_field, dst_field,
                pkt_field, byt_field, proto_field, dport_field,
            )
            snapshots.append(snapshot)

        return snapshots

    def _group_by_window(
        self, flows: List[Dict], ts_field: str
    ) -> Dict[str, List[Dict]]:
        """Group flows into time windows."""
        windows: Dict[str, List[Dict]] = defaultdict(list)
        window_secs = self.window_minutes * 60

        for flow in flows:
            ts_raw = flow.get(ts_field, "")
            try:
                ts = float(ts_raw)
                bucket = int(ts // window_secs) * window_secs
                key = str(bucket)
            except (ValueError, TypeError):
                key = "0"
            windows[key].append(flow)

        return dict(windows)

    def _build_snapshot(
        self,
        flows: List[Dict],
        dataset_id: str,
        window_idx: int,
        timestamp_key: str,
        src_field: str,
        dst_field: str,
        pkt_field: str,
        byt_field: str,
        proto_field: str,
        dport_field: str,
    ) -> GraphSnapshot:
        """Build a single graph snapshot from flows in one time window."""

        # Aggregate edge data: (src, dst) -> stats
        edge_data: Dict[tuple, Dict] = defaultdict(lambda: {
            "packets": 0, "bytes": 0, "count": 0,
            "protocols": set(), "ports": set(),
        })

        host_set: set = set()

        for flow in flows:
            src = str(flow.get(src_field, "")).strip()
            dst = str(flow.get(dst_field, "")).strip()
            if not src or not dst:
                continue

            host_set.add(src)
            host_set.add(dst)

            key = (src, dst)
            try: edge_data[key]["packets"] += int(flow.get(pkt_field, 0))
            except: pass
            try: edge_data[key]["bytes"] += int(flow.get(byt_field, 0))
            except: pass
            edge_data[key]["count"] += 1

            proto = str(flow.get(proto_field, "TCP")).upper()
            port  = flow.get(dport_field, 0)
            edge_data[key]["protocols"].add(proto)
            try: edge_data[key]["ports"].add(int(port))
            except: pass

        # Build node risk scores from edge aggregation
        node_in_risk:  Dict[str, float] = defaultdict(float)
        node_out_risk: Dict[str, float] = defaultdict(float)
        node_sus_count: Dict[str, int]  = defaultdict(int)

        SUSPICIOUS_PORTS = {22, 23, 445, 3389, 4444, 5900, 6667}

        edges: List[NetworkEdge] = []
        for (src, dst), stats in edge_data.items():
            ports = stats["ports"]
            sus_ports = ports & SUSPICIOUS_PORTS
            is_suspicious = bool(sus_ports) or stats["count"] > 50
            risk_score = min(0.3 + 0.5 * (len(sus_ports) / max(len(ports), 1)) + 0.2 * min(stats["count"] / 100.0, 1.0), 1.0)

            if is_suspicious:
                node_sus_count[src] += 1
                node_sus_count[dst] += 1

            node_out_risk[src] = max(node_out_risk[src], risk_score)
            node_in_risk[dst]  = max(node_in_risk[dst],  risk_score)

            proto = next(iter(stats["protocols"]), "TCP")
            port  = next(iter(stats["ports"]), 0)

            edges.append(NetworkEdge(
                id=f"e-{src}-{dst}-{window_idx}",
                source=src,
                target=dst,
                packet_count=stats["packets"],
                byte_count=stats["bytes"],
                protocol=proto,
                port=port,
                connection_frequency=float(stats["count"]),
                risk_score=round(risk_score, 3),
                is_suspicious=is_suspicious,
            ))

        # Build nodes
        nodes: List[NetworkNode] = []
        for ip in host_set:
            in_r  = node_in_risk.get(ip, 0.0)
            out_r = node_out_risk.get(ip, 0.0)
            sus   = node_sus_count.get(ip, 0)
            risk  = round((in_r + out_r) / 2 + min(sus * 0.05, 0.3), 3)
            risk  = min(risk, 1.0)

            # Heuristic type detection
            node_type = "host"
            if ip.endswith(".1") or ip.endswith(".254"): node_type = "router"

            nodes.append(NetworkNode(
                id=f"node-{ip}",
                label=ip,
                ip=ip,
                type=node_type,
                risk_score=risk,
                risk_level=_risk_level(risk),
                connections=len([e for e in edges if e.source == ip or e.target == ip]),
                suspicious_connections=sus,
                behavior_change=round(sus * 15.0 + risk * 20.0, 1),
                is_suspicious=sus > 0 or risk > 0.5,
            ))

        return GraphSnapshot(
            id=str(uuid.uuid4()),
            dataset_id=dataset_id,
            timestamp=timestamp_key,
            window_index=window_idx,
            nodes=nodes,
            edges=edges,
        )
