"use client";

import { Brain, TrendingUp, TrendingDown, Minus, Info, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/Badge";
import { MOCK_EXPLANATION, MOCK_FORECAST } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import type { FeatureImportance } from "@/types";
import Link from "next/link";

function ImportanceBar({
  value,
  max = 1,
  color = "#3b82f6",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-slate-200 w-10 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

function FeatureRow({ feat }: { feat: FeatureImportance }) {
  const maxVal = 0.9;
  const barColor =
    feat.value > 0.75 ? "#ef4444" :
    feat.value > 0.5  ? "#f59e0b" : "#3b82f6";

  return (
    <div className="py-2.5 border-b border-slate-800/60 last:border-0">
      <div className="flex items-center gap-3 mb-1.5">
        {/* Direction arrow */}
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
          feat.direction === "up"      ? "bg-red-500/10 border border-red-500/20" :
          feat.direction === "down"    ? "bg-green-500/10 border border-green-500/20" :
          "bg-slate-800 border border-slate-700"
        )}>
          {feat.direction === "up"   && <TrendingUp   className="w-3.5 h-3.5 text-red-400"   />}
          {feat.direction === "down" && <TrendingDown  className="w-3.5 h-3.5 text-green-400" />}
          {feat.direction === "neutral" && <Minus      className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        <span className="text-sm font-medium text-slate-200 flex-1">{feat.feature}</span>

        <span className={cn(
          "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
          feat.direction === "up"      ? "text-red-400 bg-red-500/10"   :
          feat.direction === "down"    ? "text-green-400 bg-green-500/10" :
          "text-slate-400 bg-slate-800"
        )}>
          {feat.direction === "up" ? "↑ elevated" : feat.direction === "down" ? "↓ reduced" : "stable"}
        </span>
      </div>

      <div className="flex items-center gap-3 ml-9">
        <ImportanceBar value={feat.value} max={maxVal} color={barColor} />
      </div>

      <p className="text-[11px] text-slate-500 mt-1 ml-9 leading-relaxed">{feat.description}</p>
    </div>
  );
}

export default function ExplainabilityPage() {
  const exp = MOCK_EXPLANATION;
  const forecast = MOCK_FORECAST;

  const maxNodeImportance = Math.max(...exp.importantNodes.map((n) => n.importance));
  const maxEdgeImportance = Math.max(...exp.importantEdges.map((e) => e.importance));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Explainability</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-400">
            Why is this behavior being forecast? — SHAP-style feature importance analysis
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-purple-500/5 border border-purple-500/15 px-3 py-2 rounded-lg">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span>Values from <span className="text-purple-400 font-medium">MockPredictor</span> — illustrative</span>
        </div>
      </div>

      {/* Summary banner */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-300 mb-1">Forecast Summary</p>
            <p className="text-xs text-slate-400 leading-relaxed">{exp.summary}</p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-slate-500">Predicted stage: <strong className="text-yellow-400">{forecast.predictedStage}</strong></span>
              <span className="text-slate-500">Target: <strong className="text-red-400">{forecast.target}</strong></span>
              <span className="text-slate-500">Confidence: <strong className="text-slate-200">{Math.round(forecast.confidence * 100)}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Important Nodes */}
        <Card>
          <CardHeader>
            <CardTitle>Important Nodes</CardTitle>
            <span className="text-xs text-slate-500">by importance score</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...exp.importantNodes]
              .sort((a, b) => b.importance - a.importance)
              .map((node) => {
                const pct = Math.round(node.importance * 100);
                const barColor =
                  node.importance > 0.8 ? "#ef4444" :
                  node.importance > 0.6 ? "#f97316" : "#f59e0b";
                return (
                  <div key={node.nodeId} className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-100">{node.label}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: barColor }}>
                        {node.importance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round((node.importance / maxNodeImportance) * 100)}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 w-12 text-right">
                        {pct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{node.reason}</p>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Important Edges */}
        <Card>
          <CardHeader>
            <CardTitle>Important Edges</CardTitle>
            <span className="text-xs text-slate-500">by importance score</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...exp.importantEdges]
              .sort((a, b) => b.importance - a.importance)
              .map((edge) => {
                const barColor =
                  edge.importance > 0.8 ? "#ef4444" :
                  edge.importance > 0.6 ? "#f97316" : "#f59e0b";
                return (
                  <div key={edge.edgeId} className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <span className="text-slate-100">{edge.source}</span>
                        <span className="text-slate-600 text-xs">→</span>
                        <span className="text-slate-100">{edge.target}</span>
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: barColor }}>
                        {edge.importance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round((edge.importance / maxEdgeImportance) * 100)}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{edge.reason}</p>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      {/* Feature Importance (SHAP-style) */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Behavioral Feature Importance</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              SHAP-style directional feature analysis — which signals drive the forecast
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-red-400"><TrendingUp className="w-3 h-3" /> elevated</span>
            <span className="flex items-center gap-1 text-green-400"><TrendingDown className="w-3 h-3" /> reduced</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-red-500" />
              <span>High importance (&gt;0.75)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-amber-500" />
              <span>Medium (0.5–0.75)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-blue-500" />
              <span>Lower (&lt;0.5)</span>
            </div>
          </div>
          <div>
            {exp.featureImportance.map((feat) => (
              <FeatureRow key={feat.feature} feat={feat} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Note on methodology */}
      <Card className="bg-slate-900/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Brain className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
              <p>
                <strong className="text-slate-300">About this explanation:</strong> In the current prototype, importance
                values are generated by the <code className="text-purple-400 bg-slate-800 px-1 rounded">MockPredictor</code> using
                heuristic scoring. When the <code className="text-blue-400 bg-slate-800 px-1 rounded">TemporalGNNPredictor</code> is
                trained, these values will be derived from actual gradient-based attribution (GNNExplainer / SHAP) computed
                over the trained model.
              </p>
              <p className="text-slate-500">
                All importance values are illustrative. They represent the types of signals a trained model would surface,
                not actual model outputs.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Link href="/attack-forecast">
              <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-all">
                Attack Forecast <ExternalLink className="w-3 h-3" />
              </button>
            </Link>
            <Link href="/attack-paths">
              <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-all">
                Attack Paths <ExternalLink className="w-3 h-3" />
              </button>
            </Link>
            <Link href="/research">
              <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-all">
                Model Research <ExternalLink className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
