"use client";

import { useState } from "react";
import {
  GitFork, Shield, Target, ChevronDown, ChevronUp,
  AlertTriangle, ArrowDown, Info, ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/Badge";
import { MOCK_ATTACK_PATH, MOCK_FORECAST } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import type { AttackPathNode } from "@/types";
import Link from "next/link";

const NODE_COLORS = {
  entry:    { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    label: "Entry Point" },
  target:   { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", label: "Predicted Target" },
  middle:   { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", label: "Pivot Host" },
};

function PathNodeCard({
  node,
  index,
  total,
  selected,
  onSelect,
}: {
  node: AttackPathNode;
  index: number;
  total: number;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const variant = node.isEntry ? "entry" : node.isTarget ? "target" : "middle";
  const c = NODE_COLORS[variant];
  const isLast = index === total - 1;
  const probPct = Math.round(node.probability * 100);

  return (
    <div className="flex flex-col items-center">
      {/* Path node card */}
      <button
        onClick={() => onSelect(selected ? null : node.id)}
        className={cn(
          "w-full max-w-xs p-4 rounded-xl border-2 transition-all text-left",
          c.bg, c.border,
          selected && "ring-2 ring-white/20 scale-[1.02]",
          "hover:brightness-110"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold",
              c.bg, c.border, c.text
            )}>
              {index + 1}
            </span>
            <span className={cn("text-[10px] uppercase tracking-wider font-bold", c.text)}>
              {c.label}
            </span>
          </div>
          <span className={cn("text-xs font-mono font-bold", c.text)}>{probPct}%</span>
        </div>

        <p className="text-base font-bold text-white mb-1">{node.label}</p>

        {/* Probability bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${probPct}%`,
              backgroundColor:
                variant === "entry"  ? "#ef4444" :
                variant === "target" ? "#f97316" : "#f59e0b",
            }}
          />
        </div>

        {/* Expand indicator */}
        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
          {selected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {selected ? "Hide reason" : "Why this node?"}
        </div>
      </button>

      {/* Expanded reason */}
      {selected && (
        <div className="w-full max-w-xs mt-1 p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-300 leading-relaxed">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-semibold">
            Supporting evidence
          </p>
          {node.reason}
        </div>
      )}

      {/* Arrow down connector */}
      {!isLast && (
        <div className="flex flex-col items-center my-1">
          <div className="w-px h-4 bg-slate-700" />
          <ArrowDown className="w-4 h-4 text-slate-600" />
          <div className="w-px h-4 bg-slate-700" />
        </div>
      )}
    </div>
  );
}

export default function AttackPathsPage() {
  const path = MOCK_ATTACK_PATH;
  const forecast = MOCK_FORECAST;
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const probPct = Math.round(path.probability * 100);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Attack Path Forecast</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-400">
            Predicted lateral movement path based on graph topology and behavioral anomalies
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/15 px-3 py-2 rounded-lg">
          <Info className="w-3.5 h-3.5" />
          Demo forecast · not guaranteed attack route
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Path Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Predicted Attack Path</CardTitle>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">Path probability:</span>
                <span className="text-orange-400 font-bold text-base font-mono">{probPct}%</span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Path probability bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Path confidence</span>
                  <span className="font-mono text-orange-400">{probPct}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    style={{ width: `${probPct}%` }}
                  />
                </div>
              </div>

              {/* Path nodes */}
              <div className="flex flex-col items-center py-2">
                {path.nodes.map((node, i) => (
                  <PathNodeCard
                    key={node.id}
                    node={node}
                    index={i}
                    total={path.nodes.length}
                    selected={selectedNode === node.id}
                    onSelect={setSelectedNode}
                  />
                ))}
              </div>

              {/* Target callout */}
              <div className="mt-4 flex items-center gap-3 p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl">
                <Target className="w-5 h-5 text-orange-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Predicted final target</p>
                  <p className="text-base font-bold text-orange-300">{path.potentialTarget}</p>
                </div>
                <span className="ml-auto text-xs font-mono font-bold text-orange-400">{probPct}%</span>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-800/30 border border-slate-800 rounded-lg p-3">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                <p>
                  This path is a <strong className="text-amber-400">forecast estimate</strong>, not a confirmed attack route.
                  Probability reflects model confidence based on observed graph evolution.
                  Click any node to view supporting evidence.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Path summary */}
          <Card>
            <CardHeader>
              <CardTitle>Path Summary</CardTitle>
              <Shield className="w-4 h-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Hops",          value: path.nodes.length.toString() },
                { label: "Path probability", value: `${probPct}%`,            color: "text-orange-400" },
                { label: "Predicted target", value: path.potentialTarget,     color: "text-red-400" },
                { label: "Forecast stage",   value: forecast.predictedStage,  color: "text-yellow-400" },
                { label: "Confidence",       value: `${Math.round(forecast.confidence * 100)}%` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-sm border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-500 text-xs">{item.label}</span>
                  <span className={cn("font-semibold", item.color ?? "text-white")}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Node legend */}
          <Card>
            <CardHeader>
              <CardTitle>Node Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(NODE_COLORS).map(([key, c]) => (
                <div key={key} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs", c.bg, c.border)}>
                  <span className={cn("w-2 h-2 rounded-full", c.bg, "border", c.border)} style={{ minWidth: 8 }} />
                  <span className={cn("font-semibold", c.text)}>{c.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sequence display */}
          <Card>
            <CardHeader>
              <CardTitle>Attack Sequence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {path.nodes.map((node, i) => (
                  <div key={node.id} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">
                      {i + 1}
                    </span>
                    <span className={cn(
                      "font-medium",
                      node.isEntry ? "text-red-400" :
                      node.isTarget ? "text-orange-400" : "text-yellow-400"
                    )}>
                      {node.label}
                    </span>
                    {i < path.nodes.length - 1 && (
                      <ArrowDown className="w-3 h-3 text-slate-700 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Link href="/explainability">
              <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs hover:bg-purple-600/20 transition-all font-medium">
                <span>View Explanation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </Link>
            <Link href="/attack-forecast">
              <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-600/20 transition-all font-medium">
                <span>Full Forecast</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
