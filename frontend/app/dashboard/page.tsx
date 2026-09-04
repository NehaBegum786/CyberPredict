"use client";

import {
  Shield,
  Server,
  AlertTriangle,
  TrendingUp,
  Activity,
  Eye,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { RiskForecastChart } from "@/components/charts/RiskForecastChart";
import { RiskTimelineChart } from "@/components/charts/RiskTimelineChart";
import { DemoBadge, RiskBadge } from "@/components/ui/Badge";
import { MOCK_DASHBOARD_STATS, MOCK_ALERTS, MOCK_FORECAST } from "@/lib/mockData";
import Link from "next/link";

export default function DashboardPage() {
  const stats = MOCK_DASHBOARD_STATS;
  const alerts = MOCK_ALERTS;
  const forecast = MOCK_FORECAST;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Security Operations Center</h1>
            <DemoBadge />
          </div>
          <p className="text-sm text-slate-400">
            AI-based network attack forecasting — predicted risk based on observed behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Monitoring Active</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Network Risk"
          value={stats.networkRisk}
          unit="%"
          icon={<Shield className="w-4 h-4" />}
          riskLevel={stats.networkRiskLevel}
          trend="+34% from baseline"
          trendUp
          subtitle="vs 1h ago"
        />
        <StatCard
          title="Active Hosts"
          value={stats.activeHosts}
          icon={<Server className="w-4 h-4" />}
          subtitle="in monitored segment"
          trend="3 new"
          trendUp
        />
        <StatCard
          title="Suspicious Edges"
          value={stats.suspiciousEdges}
          icon={<Activity className="w-4 h-4" />}
          riskLevel="HIGH"
          trend="+6 this window"
          trendUp
        />
        <StatCard
          title="Forecast Alerts"
          value={stats.forecastAlerts}
          icon={<AlertTriangle className="w-4 h-4" />}
          riskLevel="HIGH"
          trend="2 critical"
          trendUp
        />
      </div>

      {/* Current State + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Risk State */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Current Network State</CardTitle>
            <Eye className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-4">
              {/* Risk dial */}
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="#ef4444" strokeWidth="10"
                    strokeDasharray={`${stats.networkRisk * 2.513} ${251.3}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-red-400">{stats.networkRisk}%</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">Risk</span>
                </div>
              </div>

              <RiskBadge level={stats.networkRiskLevel} />

              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Predicted stage</span>
                  <span className="text-yellow-400 font-medium">{forecast.predictedStage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Likely target</span>
                  <span className="text-red-400 font-medium">{forecast.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confidence</span>
                  <span className="text-white font-medium">{Math.round(forecast.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trend</span>
                  <span className="text-red-400 font-medium capitalize">↑ {forecast.trend}</span>
                </div>
              </div>

              <Link
                href="/attack-forecast"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/15 border border-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-600/25 transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                View Full Forecast
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Horizon Forecast Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Multi-Horizon Attack Risk Forecast</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Predicted risk trajectory — <span className="text-amber-400">demo mode</span>
              </p>
            </div>
            <Zap className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            {/* Horizon indicators */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {[
                { label: "Current", value: "48%", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                { label: "H1", value: "61%", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
                { label: "H2", value: "74%", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                { label: "H3", value: "86%", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
              ].map((h) => (
                <div key={h.label} className={`px-3 py-1.5 rounded-lg border ${h.bg}`}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{h.label}</p>
                  <p className={`text-lg font-bold ${h.color} tabular-nums`}>{h.value}</p>
                </div>
              ))}
              <div className="ml-auto text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Confidence</p>
                <p className="text-sm font-semibold text-slate-300">87%</p>
              </div>
            </div>
            <RiskForecastChart height={200} />
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              H1/H2/H3 represent successive graph time windows · values are forecast estimates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Timeline + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Timeline</CardTitle>
            <Activity className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <RiskTimelineChart />
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span>02:00 — baseline monitoring</span>
              <span className="text-red-400">04:45 — current</span>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Alerts</CardTitle>
            <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
              {alerts.filter((a) => !a.isRead).length} new
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} compact />
              ))}
            </div>
            <Link
              href="/attack-forecast"
              className="mt-3 flex items-center justify-center w-full text-xs text-slate-400 hover:text-slate-200 transition-all py-2 border-t border-slate-800"
            >
              View all forecasts →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Pipeline Status</CardTitle>
          <span className="text-xs text-green-400 font-medium">All systems operational</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { label: "Traffic Ingest", status: "active" },
              { label: "Preprocessing", status: "active" },
              { label: "Graph Builder", status: "active" },
              { label: "Spatial GNN", status: "demo" },
              { label: "Temporal Encoder", status: "demo" },
              { label: "Forecasting", status: "demo" },
              { label: "Attack Path", status: "demo" },
              { label: "Explainability", status: "demo" },
              { label: "SOC Output", status: "active" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 shrink-0">
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  step.status === "active"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                    step.status === "active" ? "bg-green-400" : "bg-amber-400"
                  }`} />
                  {step.label}
                </div>
                {i < 8 && <span className="text-slate-700">→</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Stages marked <span className="text-amber-400">demo</span> use the mock prediction engine.
            Replace <code className="text-blue-400 bg-slate-800 px-1 rounded">MockPredictor</code> with{" "}
            <code className="text-blue-400 bg-slate-800 px-1 rounded">TemporalGNNPredictor</code> to use a trained model.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
