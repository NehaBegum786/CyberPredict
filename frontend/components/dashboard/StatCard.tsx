"use client";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  riskLevel?: RiskLevel;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
}

const riskStyles: Record<RiskLevel, { border: string; value: string; glow: string }> = {
  LOW: {
    border: "border-green-500/20",
    value: "text-green-400",
    glow: "from-green-500/5",
  },
  MEDIUM: {
    border: "border-yellow-500/20",
    value: "text-yellow-400",
    glow: "from-yellow-500/5",
  },
  HIGH: {
    border: "border-red-500/20",
    value: "text-red-400",
    glow: "from-red-500/5",
  },
  CRITICAL: {
    border: "border-red-600/30",
    value: "text-red-500",
    glow: "from-red-600/8",
  },
};

export function StatCard({
  title,
  value,
  unit,
  icon,
  riskLevel,
  trend,
  trendUp,
  subtitle,
  className,
}: StatCardProps) {
  const style = riskLevel ? riskStyles[riskLevel] : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-slate-900/60 p-5 transition-all hover:bg-slate-900/80",
        style ? style.border : "border-slate-800",
        className
      )}
    >
      {/* Subtle gradient background */}
      {style && (
        <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none", style.glow)} />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{title}</p>
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400">
            {icon}
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <span className={cn("text-3xl font-bold tabular-nums", style ? style.value : "text-white")}>
            {value}
          </span>
          {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
        </div>

        {/* Trend / subtitle */}
        {(trend || subtitle) && (
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span className={cn("text-xs font-medium", trendUp ? "text-red-400" : "text-green-400")}>
                {trendUp ? "↑" : "↓"} {trend}
              </span>
            )}
            {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
