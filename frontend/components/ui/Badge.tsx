"use client";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "risk" | "status" | "demo" | "outline";
  riskLevel?: RiskLevel;
}

export function Badge({ children, className, variant = "default", riskLevel }: BadgeProps) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase border";

  const variants: Record<string, string> = {
    default: "bg-slate-800 border-slate-700 text-slate-300",
    outline: "bg-transparent border-slate-600 text-slate-400",
    demo: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    status: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };

  const riskVariants: Record<RiskLevel, string> = {
    LOW: "bg-green-500/10 border-green-500/30 text-green-400",
    MEDIUM: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    HIGH: "bg-red-500/10 border-red-500/30 text-red-400",
    CRITICAL: "bg-red-700/10 border-red-600/40 text-red-500",
  };

  return (
    <span
      className={cn(
        base,
        riskLevel ? riskVariants[riskLevel] : variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function DemoBadge() {
  return (
    <Badge variant="demo">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Demo Forecast Mode
    </Badge>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge riskLevel={level}>{level}</Badge>;
}
