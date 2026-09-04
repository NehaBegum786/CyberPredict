"use client";

import { useState } from "react";
import {
  TrendingUp, Target, Shield, AlertTriangle, CheckCircle2,
  Clock, ChevronRight, Zap, Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DemoBadge, RiskBadge } from "@/components/ui/Badge";
import { RiskForecastChart } from "@/components/charts/RiskForecastChart";
import {
  MOCK_FORECAST,
  MOCK_ATTACK_PROGRESSION,
  MOCK_ALERTS,
  FORECAST_CHART_DATA,
} from "@/lib/mockData";
import { cn, getStageStatusColor, formatTimestamp } from "@/lib/utils";
import type { AttackProgressionStage } from "@/types";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  observed: "Observed",
  inferred:  "Inferred",
  forecast:  "Forecast",
  none:      "No activity",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  observed: CheckCircle2,
  inferred:  AlertTriangle,
  forecast:  TrendingUp,
  none:      Clock,
};

function ProgressionStepper({ stages }: { stages: AttackProgressionStage[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-5 top-6 bottom-6 w-px bg-slate-800 z-0" />

      <div className="space-y-2">
        {stages.map((stage, i) => {
          const Icon = STATUS_ICONS[stage.status] || Clock;
          const colorClass = getStageStatusColor(stage.status);
          const isLast = i === stages.length - 1;
          const isOpen = expanded === stage.stage;

          return (
            <div key={stage.stage} className="relative z-10">
              <button
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left",
                  colorClass,
                  "hover:brightness-110"
                )}
                onClick={() => setExpanded(isOpen ? null : stage.stage)}
              >
                {/* Step circle */}
                <div className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0",
                  stage.status === "observed" ? "border-indigo-500/50 bg-indigo-500/10" :
                  stage.status === "inferred"  ? "border-yellow-500/50 bg-yellow-500/10" :
                  stage.status === "forecast"  ? "border-red-500/50 bg-red-500/10" :
                  "border-slate-700 bg-slate-800/40"
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    stage.status === "observed" ? "text-indigo-400" :
                    stage.status === "inferred"  ? "text-yellow-400" :
                    stage.status === "forecast"  ? "text-red-400" : "text-slate-500"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-slate-100">{stage.stage}</span>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border",
                      colorClass
                    )}>
                      {STATUS_LABELS[stage.status]}
                    </span>
                    {stage.timestamp && (
                      <span className="text-[10px] text-slate-500 font-mono">{stage.timestamp}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{stage.description}</p>
                </div>

                <ChevronRight className={cn(
                  "w-4 h-4 text-slate-600 shrink-0 mt-1 transition-transform",
                  isOpen && "rotate-90"
                )} />
              </button>

              {/* Expanded indicators */}
              {isOpen && stage.indicators && (
                <div className="ml-12 mt-1 mb-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2 font-semibold">
                    Indicators
                  </p>
                  <ul className="space-y-1">
                    {stage.indicators.map((ind) => (
                      <li key={ind} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="w-1 h-1 rounded-full bg-slate-500 shrink-0" />
                        {ind}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AttackForecastPage() {
  const forecast = MOCK_FORECAST;
  const alerts = MOCK_ALERTS.filter((a) => !a.isRead);

  return (
    <div className="p-6 space-y-6 max-w-[1300px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Attack Forecast</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-400">
            Multi-horizon predicted risk · attack stage inference · confidence-bounded estimates
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-500/5 border border-amber-500/15 px-3 py-2 rounded-lg">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Values generated by <span className="text-amber-400 font-medium">MockPredictor</span> — demonstration only
          </span>
        </div>
      </div>

      {/* Top row: current state + forecast summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Network State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Network State</CardTitle>
            <Shield className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Network behavior</p>
              <p className="text-base font-semibold text-yellow-300">Increasingly suspicious</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Risk",       value: `${Math.round(forecast.currentRisk * 100)}%`, badge: true },
                { label: "Confidence", value: `${Math.round(forecast.confidence * 100)}%`, color: "text-slate-200" },
                { label: "Trend",      value: "↑ Increasing",  color: "text-red-400" },
                { label: "Stage",      value: forecast.predictedStage, color: "text-yellow-400" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
                  {item.badge ? (
                    <RiskBadge level={forecast.currentRiskLevel} />
                  ) : (
                    <p className={cn("text-sm font-semibold", item.color ?? "text-slate-200")}>{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Forecast Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Summary</CardTitle>
            <Zap className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Likely future behavior</p>
              <p className="text-base font-semibold text-red-300">Malicious lateral interaction</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Potential target",    value: forecast.target,                           color: "text-red-400" },
                { label: "Forecast confidence", value: `${Math.round(forecast.confidence * 100)}%`, color: "text-slate-200" },
                { label: "Path probability",    value: `${Math.round(forecast.pathProbability * 100)}%`, color: "text-orange-400" },
                { label: "Predicted stage",     value: forecast.predictedStage,                   color: "text-yellow-400" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
                  <p className={cn("text-sm font-semibold", item.color)}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Link href="/attack-paths" className="flex-1">
                <button className="w-full px-3 py-2 rounded-lg bg-blue-600/15 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-600/25 transition-all font-medium">
                  View Attack Path
                </button>
              </Link>
              <Link href="/explainability" className="flex-1">
                <button className="w-full px-3 py-2 rounded-lg bg-purple-600/15 border border-purple-500/20 text-purple-400 text-xs hover:bg-purple-600/25 transition-all font-medium">
                  View Explanation
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-horizon chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Multi-Horizon Attack Risk Forecast</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Risk trajectory across successive graph time windows · confidence bounds shown
            </p>
          </div>
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded font-semibold">
            Demo Forecast Mode
          </span>
        </CardHeader>
        <CardContent>
          {/* Horizon cards */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Current", risk: 0.48, conf: 1.0,  type: "observed", color: "blue" },
              { label: "H1",      risk: 0.61, conf: 0.91, type: "forecast", color: "yellow" },
              { label: "H2",      risk: 0.74, conf: 0.84, type: "forecast", color: "orange" },
              { label: "H3",      risk: 0.86, conf: 0.76, type: "forecast", color: "red" },
            ].map((h) => {
              const colorMap: Record<string, { text: string; bg: string; border: string }> = {
                blue:   { text: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
                yellow: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                red:    { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
              };
              const c = colorMap[h.color];
              return (
                <div key={h.label} className={`p-3 rounded-xl border ${c.bg} ${c.border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{h.label}</p>
                    <span className={`text-[9px] uppercase font-bold ${h.type === "observed" ? "text-blue-400" : "text-amber-400"}`}>
                      {h.type}
                    </span>
                  </div>
                  <p className={`text-2xl font-bold tabular-nums ${c.text}`}>
                    {Math.round(h.risk * 100)}%
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">conf. {Math.round(h.conf * 100)}%</p>
                  {/* Mini bar */}
                  <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(h.risk * 100)}%`, backgroundColor:
                      h.color === "blue" ? "#3b82f6" : h.color === "yellow" ? "#f59e0b" : h.color === "orange" ? "#f97316" : "#ef4444"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <RiskForecastChart height={220} />

          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            {[
              { dot: "bg-blue-400",  label: "Observed / Current state" },
              { dot: "bg-red-400",   label: "Forecast (demo predictor)" },
              { dot: "bg-slate-600", label: "Risk threshold lines (Low / Med / High)" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-slate-500">
                <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                {l.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attack Progression + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attack Progression */}
        <Card>
          <CardHeader>
            <CardTitle>Attack Progression Timeline</CardTitle>
            <div className="flex gap-1.5">
              {["observed","inferred","forecast"].map((s) => (
                <span key={s} className={cn("text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wide", getStageStatusColor(s))}>
                  {s}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ProgressionStepper stages={MOCK_ATTACK_PROGRESSION} />
            <p className="text-[10px] text-slate-600 mt-4 leading-relaxed">
              Stage status terminology: <strong className="text-indigo-400">Observed</strong> — confirmed in traffic data ·{" "}
              <strong className="text-yellow-400">Inferred</strong> — consistent with behavioral pattern ·{" "}
              <strong className="text-red-400">Forecast</strong> — predicted, not yet confirmed
            </p>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Forecast Alerts</CardTitle>
            <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
              {alerts.length} unread
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-xl border space-y-1.5",
                  alert.severity === "CRITICAL" ? "bg-red-900/10 border-red-700/30" :
                  alert.severity === "HIGH"     ? "bg-red-500/8  border-red-500/20" :
                  "bg-yellow-500/5 border-yellow-500/20"
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertTriangle className={cn(
                    "w-3.5 h-3.5",
                    alert.severity === "CRITICAL" ? "text-red-500" :
                    alert.severity === "HIGH"     ? "text-red-400" : "text-yellow-400"
                  )} />
                  <RiskBadge level={alert.severity} />
                  {!alert.isRead && (
                    <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">New</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-200">{alert.title}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-slate-500">
                  <span>Target: <strong className="text-slate-300">{alert.potentialTarget}</strong></span>
                  <span>Stage: <strong className="text-slate-300">{alert.predictedStage}</strong></span>
                  <span>Conf: <strong className="text-slate-300">{Math.round(alert.confidence * 100)}%</strong></span>
                  <span>Horizon: <strong className="text-slate-300">{alert.forecastHorizon}</strong></span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Link href="/explainability" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    View Explanation <ChevronRight className="w-3 h-3" />
                  </Link>
                  <span className="text-[10px] text-slate-600">{formatTimestamp(alert.timestamp)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
