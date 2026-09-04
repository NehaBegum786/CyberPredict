"use client";

import { useState } from "react";
import {
  BookOpen, AlertTriangle, CheckCircle2, Info,
  TrendingUp, BarChart2, Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/Badge";
import { MOCK_MODEL_COMPARISONS } from "@/lib/mockData";
import type { ModelComparison, ModelMetrics } from "@/types";
import { cn } from "@/lib/utils";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend,
} from "recharts";

// ─── Metric helpers ───────────────────────────────────────────────────────────

const METRIC_LABELS: Record<keyof ModelMetrics, string> = {
  precision: "Precision",
  recall:    "Recall",
  f1:        "F1 Score",
  fpr:       "FPR",
  prAuc:     "PR-AUC",
  rocAuc:    "ROC-AUC",
  leadTime:  "Lead Time",
  hitsAtK:   "Hits@K",
};

const MODEL_COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
];

function MetricCell({ value, isIllustrative }: { value: number | string | null; isIllustrative: boolean }) {
  if (value === null) {
    return (
      <span className="text-slate-600 text-xs italic">
        {isIllustrative ? "—" : "Pending"}
      </span>
    );
  }
  if (typeof value === "string") {
    return <span className="text-slate-300 text-xs">{value}</span>;
  }
  const pct = Math.round(value * 100);
  const color =
    pct >= 85 ? "text-green-400" :
    pct >= 70 ? "text-yellow-400" : "text-red-400";
  return (
    <span className={cn("text-xs font-mono font-bold tabular-nums", color)}>
      {pct}%
    </span>
  );
}

// ─── Radar chart data ────────────────────────────────────────────────────────

function buildRadarData(models: ModelComparison[]) {
  const dims = ["precision","recall","f1","prAuc","rocAuc","hitsAtK"] as const;
  return dims.map((dim) => {
    const point: Record<string, string | number> = { metric: METRIC_LABELS[dim] };
    models.forEach((m) => {
      const v = m.metrics[dim];
      point[m.modelName] = v !== null ? Math.round((v as number) * 100) : 0;
    });
    return point;
  });
}

// ─── Bar chart data ──────────────────────────────────────────────────────────

function buildBarData(models: ModelComparison[]) {
  return models.map((m, i) => ({
    name: m.modelName.replace("(proposed)", "").trim(),
    F1:       m.metrics.f1     !== null ? Math.round(m.metrics.f1     * 100) : 0,
    "ROC-AUC":m.metrics.rocAuc !== null ? Math.round(m.metrics.rocAuc * 100) : 0,
    fill: MODEL_COLORS[i],
    pending: m.metrics.f1 === null,
  }));
}

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<"table" | "radar" | "bar">("table");
  const models = MOCK_MODEL_COMPARISONS;
  const radarData = buildRadarData(models);
  const barData = buildBarData(models);

  const numericMetrics: (keyof ModelMetrics)[] = [
    "precision","recall","f1","fpr","prAuc","rocAuc","hitsAtK",
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Research &amp; Model Comparison</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-400">
            Comparative analysis of baseline and proposed models for network attack forecasting
          </p>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/25 bg-amber-500/5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-amber-300">Illustrative results only.</strong>{" "}
          Metric values for all baseline models are representative placeholders — not results
          from experiments on a specific dataset. The Temporal GNN (proposed) model has not yet
          been trained; its metrics are marked as <em>Pending</em>. This comparison illustrates
          the expected positioning and will be updated with real experimental results.
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-0">
        {[
          { key: "table", label: "Metrics Table",   icon: BarChart2 },
          { key: "radar", label: "Radar Chart",     icon: TrendingUp },
          { key: "bar",   label: "F1 / ROC-AUC Bar",icon: BarChart2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all",
              activeTab === key
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Table view */}
      {activeTab === "table" && (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-500 py-3 pr-4 font-medium min-w-[160px]">Model</th>
                    <th className="text-left text-slate-500 py-3 pr-4 font-medium">Category</th>
                    {numericMetrics.map((m) => (
                      <th key={m} className="text-center text-slate-500 py-3 px-3 font-medium whitespace-nowrap">
                        {METRIC_LABELS[m]}
                      </th>
                    ))}
                    <th className="text-center text-slate-500 py-3 px-3 font-medium whitespace-nowrap">Lead Time</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model, i) => (
                    <tr
                      key={model.modelName}
                      className={cn(
                        "border-b border-slate-800/50 hover:bg-slate-800/20 transition-all",
                        !model.isIllustrative && "bg-blue-500/5"
                      )}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: MODEL_COLORS[i] }}
                          />
                          <span className={cn(
                            "font-semibold",
                            !model.isIllustrative ? "text-blue-300" : "text-slate-200"
                          )}>
                            {model.modelName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border",
                          model.category === "Proposed"
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            : model.category === "Graph-based"
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            : model.category === "Sequential"
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        )}>
                          {model.category}
                        </span>
                      </td>
                      {numericMetrics.map((metric) => (
                        <td key={metric} className="py-3 px-3 text-center">
                          <MetricCell
                            value={model.metrics[metric]}
                            isIllustrative={model.isIllustrative}
                          />
                        </td>
                      ))}
                      <td className="py-3 px-3 text-center">
                        <span className="flex items-center justify-center gap-1 text-xs text-slate-300">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {model.metrics.leadTime ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Row descriptions */}
            <div className="mt-5 space-y-2">
              {models.map((m, i) => (
                <div key={m.modelName} className="flex items-start gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: MODEL_COLORS[i] }} />
                  <div>
                    <span className="text-slate-300 font-medium">{m.modelName}: </span>
                    <span className="text-slate-500">{m.description}</span>
                    {m.isIllustrative && (
                      <span className="ml-2 text-amber-400 italic">· Illustrative values</span>
                    )}
                    {!m.isIllustrative && (
                      <span className="ml-2 text-blue-400 font-semibold">· Pending experimental results</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Radar view */}
      {activeTab === "radar" && (
        <Card>
          <CardHeader>
            <CardTitle>Multi-Metric Radar Comparison</CardTitle>
            <span className="text-xs text-amber-400">Illustrative / Not Experimental Results</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0f1629", border: "1px solid #1e293b", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(v: number) => [`${v}%`]}
                />
                {models.filter((m) => m.isIllustrative).map((m, i) => (
                  <Radar
                    key={m.modelName}
                    name={m.modelName}
                    dataKey={m.modelName}
                    stroke={MODEL_COLORS[i]}
                    fill={MODEL_COLORS[i]}
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                ))}
                <Legend
                  wrapperStyle={{ color: "#94a3b8", fontSize: 11 }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-600 text-center mt-2">
              Temporal GNN excluded (results pending) · all values illustrative
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bar chart view */}
      {activeTab === "bar" && (
        <Card>
          <CardHeader>
            <CardTitle>F1 Score &amp; ROC-AUC Comparison</CardTitle>
            <span className="text-xs text-amber-400">Illustrative / Not Experimental Results</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={barData.filter((d) => !d.pending)}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "#0f1629", border: "1px solid #1e293b", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(v: number) => [`${v}%`]}
                />
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
                <Bar dataKey="F1"       fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={40} />
                <Bar dataKey="ROC-AUC"  fill="#6366f1" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 justify-center">
              <span>Temporal GNN not shown — training pending</span>
              <span>·</span>
              <span className="text-amber-400">All values illustrative</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key insight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: CheckCircle2,
            color: "text-green-400",
            bg:    "bg-green-500/5 border-green-500/15",
            title: "Graph topology matters",
            desc:  "GraphSAGE outperforms LSTM and random forest, suggesting host communication structure carries predictive signal beyond temporal flow features.",
          },
          {
            icon: TrendingUp,
            color: "text-blue-400",
            bg:    "bg-blue-500/5 border-blue-500/15",
            title: "Lead time is the differentiator",
            desc:  "Baseline models are reactive (0-window lead time). Temporal GNN is designed to forecast 2–3 windows ahead — the key research contribution.",
          },
          {
            icon: Info,
            color: "text-amber-400",
            bg:    "bg-amber-500/5 border-amber-500/15",
            title: "Pending: real evaluation",
            desc:  "The proposed Temporal GNN must be trained and evaluated on real network datasets (e.g., CICIDS, NF-ToN-IoT) to validate these projected gains.",
          },
        ].map((card) => (
          <div key={card.title} className={`p-4 rounded-xl border ${card.bg}`}>
            <card.icon className={`w-4 h-4 ${card.color} mb-2`} />
            <p className="text-sm font-semibold text-slate-200 mb-1">{card.title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
