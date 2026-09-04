"use client";

import Link from "next/link";
import { Shield, ArrowRight, Play, BookOpen, Activity, Network, Brain, TrendingUp, ChevronRight } from "lucide-react";
import { DemoBadge } from "@/components/ui/Badge";

const PIPELINE_STEPS = [
  { label: "Network Traffic", sublabel: "Raw flow data ingestion", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Dynamic Graph", sublabel: "Evolving host communication graph", icon: Network, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { label: "Temporal Learning", sublabel: "Spatial + temporal pattern learning", icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { label: "Attack Forecast", sublabel: "Multi-horizon risk prediction", icon: TrendingUp, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

const FEATURES = [
  { title: "Observe & Graph", desc: "Convert raw network traffic into evolving host communication graphs for spatial analysis." },
  { title: "Learn Patterns", desc: "Graph neural networks learn spatial topology; temporal encoders capture behavioral evolution." },
  { title: "Forecast Risk", desc: "Multi-horizon forecasting predicts attack risk for future time windows — not just the present." },
  { title: "Explain & Warn", desc: "Every forecast comes with SHAP-style feature importance and predicted attack path visualization." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-indigo-600/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Demo badge */}
          <div className="flex justify-center mb-6">
            <DemoBadge />
          </div>

          {/* Title */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight">CyberPredict</h1>
          </div>

          <p className="text-xl text-blue-400 font-semibold mb-4">
            Forecast cyberattacks before they become incidents.
          </p>

          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            An AI-driven network security platform that learns evolving communication behavior
            and forecasts potential attack progression — not just detects, but predicts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all text-sm"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-semibold transition-all text-sm"
            >
              <Play className="w-4 h-4 text-green-400" />
              View Demo
            </Link>
            <Link
              href="/architecture"
              className="flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg font-semibold transition-all text-sm"
            >
              <BookOpen className="w-4 h-4" />
              Research Architecture
            </Link>
          </div>

          {/* Pipeline Visualization */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border ${step.bg}`}>
                  <step.icon className={`w-4 h-4 ${step.color}`} />
                  <div className="text-left">
                    <p className={`text-xs font-semibold ${step.color}`}>{step.label}</p>
                    <p className="text-[10px] text-slate-500 hidden sm:block">{step.sublabel}</p>
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="px-6 py-12 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Traditional */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Traditional IDS</p>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="font-mono text-sm">Detect</span>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <span className="font-mono text-sm">Alert</span>
            </div>
            <p className="text-xs text-slate-500 mt-3">Reacts after the attack pattern is matched — too late for prevention.</p>
          </div>

          {/* CyberPredict */}
          <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-3 font-semibold">CyberPredict</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {["Observe", "Learn", "Forecast", "Explain", "Warn"].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="font-mono text-blue-300 text-xs">{step}</span>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-blue-600" />}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">Forecasts future risk based on evolving network behavior patterns.</p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-all">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Research Note */}
      <section className="px-6 pb-12 max-w-5xl mx-auto w-full">
        <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">SIH26153 Research Prototype</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                This platform is a research prototype for the problem statement:{" "}
                <em>"AI-Based Network Attack Forecasting from Network Traffic Data."</em>{" "}
                Current forecasts are generated by a <strong className="text-amber-400">mock prediction engine</strong>{" "}
                (Demo Forecast Mode). The Temporal GNN model is architecturally integrated but requires training on real network datasets.
                All forecasts represent <strong>estimated risk</strong>, not guaranteed attack outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 px-6 py-4 mt-auto">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>CyberPredict — AI Network Attack Forecasting</span>
          <span className="font-mono">SIH26153 · Demo Prototype</span>
        </div>
      </footer>
    </div>
  );
}
