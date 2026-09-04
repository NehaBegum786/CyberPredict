"use client";

import { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

import { Network, Filter, SlidersHorizontal, Info } from "lucide-react";
import { NetworkGraphNode } from "@/components/graph/NetworkGraphNode";
import { NetworkGraphEdge } from "@/components/graph/NetworkGraphEdge";
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { DemoBadge, RiskBadge } from "@/components/ui/Badge";
import { MOCK_NODES, MOCK_EDGES } from "@/lib/mockData";
import type { NetworkNode, NetworkEdge, RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

const NODE_TYPES = { networkNode: NetworkGraphNode };
const EDGE_TYPES = { networkEdge: NetworkGraphEdge };

// Convert mock data to React Flow format
function toFlowNodes(nodes: NetworkNode[]): Node<NetworkNode>[] {
  return nodes.map((n) => ({
    id: n.id,
    type: "networkNode",
    position: { x: n.x ?? 300, y: n.y ?? 200 },
    data: n,
  }));
}

function toFlowEdges(edges: NetworkEdge[]): Edge<NetworkEdge>[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "networkEdge",
    data: e,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: e.isSuspicious ? "#ef4444" : "#334155",
    },
  }));
}

const RISK_FILTER_OPTIONS: { label: string; value: RiskLevel | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Critical", value: "CRITICAL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

export default function NetworkGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(MOCK_NODES));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(MOCK_EDGES));
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NetworkNode>) => {
    setSelectedNode(node.data);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Filtered nodes/edges
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => {
      const data = n.data as NetworkNode;
      if (showSuspiciousOnly && !data.isSuspicious) return false;
      if (riskFilter !== "ALL" && data.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [nodes, riskFilter, showSuspiciousOnly]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)),
    [edges, visibleNodeIds]
  );

  const stats = useMemo(() => {
    const suspicious = MOCK_NODES.filter((n) => n.isSuspicious).length;
    const suspiciousEdges = MOCK_EDGES.filter((e) => e.isSuspicious).length;
    return { suspicious, suspiciousEdges };
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#080d1a]/80 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Network className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-bold text-white">Network Communication Graph</h1>
              <DemoBadge />
            </div>
            <p className="text-xs text-slate-400">
              Evolving host communication graph · Window T3 · Click nodes and edges for details
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-500">Nodes </span>
              <span className="text-white font-semibold">{MOCK_NODES.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-500">Edges </span>
              <span className="text-white font-semibold">{MOCK_EDGES.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-slate-500">Suspicious nodes </span>
              <span className="text-red-400 font-semibold">{stats.suspicious}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-slate-500">Suspicious edges </span>
              <span className="text-red-400 font-semibold">{stats.suspiciousEdges}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Filter by risk:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {RISK_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRiskFilter(opt.value)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                  riskFilter === opt.value
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-slate-700" />

          <button
            onClick={() => setShowSuspiciousOnly((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all border",
              showSuspiciousOnly
                ? "bg-red-500/15 border-red-500/30 text-red-400"
                : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
            )}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Suspicious only
          </button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2.5}
          className="bg-[#0a0e1a]"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#1e293b"
          />
          <Controls
            className="!bg-slate-900 !border-slate-700"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(n) => {
              const data = n.data as NetworkNode;
              if (data.riskLevel === "CRITICAL") return "#dc2626";
              if (data.riskLevel === "HIGH") return "#ef4444";
              if (data.riskLevel === "MEDIUM") return "#f59e0b";
              return "#22c55e";
            }}
            maskColor="rgba(8, 13, 26, 0.8)"
            style={{ background: "#0f1629", border: "1px solid #1e293b" }}
          />
        </ReactFlow>

        {/* Node detail panel */}
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />

        {/* Legend */}
        <GraphLegend />

        {/* Graph window indicator */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <div>
              <p className="text-slate-300 font-semibold">Window T3</p>
              <p className="text-slate-500">Current graph snapshot · Lateral movement inferred</p>
            </div>
          </div>
        </div>

        {/* Selected node hint */}
        {!selectedNode && (
          <div className="absolute bottom-4 right-4 z-10 text-xs text-slate-600 bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2">
            Click a node or edge for details
          </div>
        )}
      </div>

      {/* Attack Path Overlay Banner */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-slate-800 bg-[#080d1a]/80">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Forecast attack path:</span>
          {["External Host", "PC-01", "SERVER-01", "DB-01"].map((node, i, arr) => (
            <span key={node} className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded font-medium",
                i === 0 ? "text-red-400 bg-red-500/10 border border-red-500/20" :
                i === arr.length - 1 ? "text-orange-400 bg-orange-500/10 border border-orange-500/20" :
                "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20"
              )}>
                {node}
              </span>
              {i < arr.length - 1 && <span className="text-slate-600">→</span>}
            </span>
          ))}
          <span className="ml-2 text-slate-500">· Path probability: <strong className="text-slate-300">78%</strong></span>
          <span className="ml-auto text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
            Demo Forecast
          </span>
        </div>
      </div>
    </div>
  );
}
