"use client";

import { X, Monitor, Server, Database, Router, Wifi, Globe } from "lucide-react";
import type { NetworkNode, NodeType } from "@/types";
import { RiskBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const NODE_ICONS: Record<NodeType, React.ElementType> = {
  host: Monitor,
  server: Server,
  database: Database,
  router: Router,
  iot: Wifi,
  external: Globe,
};

interface NodeDetailPanelProps {
  node: NetworkNode | null;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  if (!node) return null;

  const Icon = NODE_ICONS[node.type] || Monitor;
  const riskPct = Math.round(node.riskScore * 100);

  return (
    <div className="absolute top-4 right-4 z-10 w-64 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">{node.label}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Risk */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Risk Level</span>
          <RiskBadge level={node.riskLevel} />
        </div>

        {/* Risk bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Risk Score</span>
            <span
              className={cn(
                "font-mono font-bold",
                riskPct >= 80 ? "text-red-400" :
                riskPct >= 60 ? "text-yellow-400" : "text-green-400"
              )}
            >
              {riskPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${riskPct}%`,
                backgroundColor:
                  riskPct >= 80 ? "#ef4444" :
                  riskPct >= 60 ? "#f59e0b" : "#22c55e",
              }}
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-xs">
          {[
            { label: "IP Address", value: node.ip, mono: true },
            { label: "Host Type", value: node.type.charAt(0).toUpperCase() + node.type.slice(1) },
            { label: "Connections", value: node.connections.toString() },
            {
              label: "Suspicious",
              value: node.suspiciousConnections.toString(),
              valueClass: node.suspiciousConnections > 0 ? "text-red-400" : "text-green-400",
            },
            {
              label: "Behavior Change",
              value: `+${node.behaviorChange}%`,
              valueClass: node.behaviorChange > 30 ? "text-red-400" : node.behaviorChange > 10 ? "text-yellow-400" : "text-green-400",
            },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-slate-500">{item.label}</span>
              <span className={cn("text-slate-200", item.mono && "font-mono text-[11px]", item.valueClass)}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {node.isSuspicious && (
          <div className="mt-2 flex items-center gap-2 px-2.5 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Suspicious activity detected</span>
          </div>
        )}
      </div>
    </div>
  );
}
