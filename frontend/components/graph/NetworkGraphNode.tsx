"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Monitor,
  Server,
  Database,
  Router,
  Wifi,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NetworkNode, NodeType } from "@/types";

const NODE_ICONS: Record<NodeType, React.ElementType> = {
  host: Monitor,
  server: Server,
  database: Database,
  router: Router,
  iot: Wifi,
  external: Globe,
};

const NODE_COLORS: Record<NodeType, { border: string; bg: string; icon: string; ring: string }> = {
  host:     { border: "border-blue-500/40",   bg: "bg-blue-500/10",    icon: "text-blue-400",    ring: "ring-blue-500/30" },
  server:   { border: "border-purple-500/40", bg: "bg-purple-500/10",  icon: "text-purple-400",  ring: "ring-purple-500/30" },
  database: { border: "border-cyan-500/40",   bg: "bg-cyan-500/10",    icon: "text-cyan-400",    ring: "ring-cyan-500/30" },
  router:   { border: "border-slate-500/40",  bg: "bg-slate-700/40",   icon: "text-slate-300",   ring: "ring-slate-500/30" },
  iot:      { border: "border-green-500/40",  bg: "bg-green-500/10",   icon: "text-green-400",   ring: "ring-green-500/30" },
  external: { border: "border-red-500/40",    bg: "bg-red-500/10",     icon: "text-red-400",     ring: "ring-red-500/30" },
};

const RISK_RING: Record<string, string> = {
  CRITICAL: "ring-2 ring-red-500/60",
  HIGH:     "ring-2 ring-orange-500/50",
  MEDIUM:   "ring-1 ring-yellow-500/40",
  LOW:      "",
};

export const NetworkGraphNode = memo(({ data, selected }: NodeProps<NetworkNode>) => {
  const colors = NODE_COLORS[data.type] || NODE_COLORS.host;
  const Icon = NODE_ICONS[data.type] || Monitor;
  const riskRing = RISK_RING[data.riskLevel] || "";
  const riskPct = Math.round(data.riskScore * 100);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer select-none",
        "min-w-[90px]",
        colors.bg,
        colors.border,
        riskRing,
        data.isSuspicious && "animate-pulse-slow",
        selected && "ring-2 ring-white/40 scale-105"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-500 !border-slate-400"
      />

      {/* Suspicious indicator */}
      {data.isSuspicious && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 border border-red-700 animate-ping" />
      )}
      {data.isSuspicious && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 border border-red-700" />
      )}

      {/* Icon */}
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg, "border", colors.border)}>
        <Icon className={cn("w-4 h-4", colors.icon)} />
      </div>

      {/* Label */}
      <p className="text-[11px] font-semibold text-slate-200 text-center leading-tight max-w-[80px] truncate">
        {data.label}
      </p>

      {/* Risk bar */}
      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${riskPct}%`,
            backgroundColor:
              riskPct >= 80 ? "#ef4444" :
              riskPct >= 60 ? "#f59e0b" :
              riskPct >= 30 ? "#eab308" : "#22c55e",
          }}
        />
      </div>

      {/* Risk % */}
      <p className={cn(
        "text-[9px] font-mono font-bold",
        riskPct >= 80 ? "text-red-400" :
        riskPct >= 60 ? "text-yellow-400" : "text-green-400"
      )}>
        {riskPct}% risk
      </p>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-500 !border-slate-400"
      />
    </div>
  );
});

NetworkGraphNode.displayName = "NetworkGraphNode";
