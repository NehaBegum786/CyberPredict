"use client";

import { AlertTriangle, ChevronRight, Clock } from "lucide-react";
import type { ForecastAlert } from "@/types";
import { cn, getRiskBgColor, formatTimestamp } from "@/lib/utils";
import { RiskBadge } from "@/components/ui/Badge";
import Link from "next/link";

interface AlertCardProps {
  alert: ForecastAlert;
  compact?: boolean;
}

export function AlertCard({ alert, compact }: AlertCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all hover:border-slate-600",
        getRiskBgColor(alert.severity),
        !alert.isRead && "ring-1 ring-inset ring-slate-700/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <AlertTriangle
            className={cn(
              "w-4 h-4",
              alert.severity === "CRITICAL" ? "text-red-500" :
              alert.severity === "HIGH" ? "text-red-400" :
              alert.severity === "MEDIUM" ? "text-yellow-400" : "text-blue-400"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <RiskBadge level={alert.severity} />
            {!alert.isRead && (
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wide font-semibold">
                New
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-slate-200 mb-1">{alert.title}</p>
          {!compact && (
            <p className="text-xs text-slate-400 mb-2">{alert.description}</p>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>Target: <strong className="text-slate-300">{alert.potentialTarget}</strong></span>
            <span>Stage: <strong className="text-slate-300">{alert.predictedStage}</strong></span>
            <span>Confidence: <strong className="text-slate-300">{Math.round(alert.confidence * 100)}%</strong></span>
            <span>Horizon: <strong className="text-slate-300">{alert.forecastHorizon}</strong></span>
          </div>

          {!compact && (
            <div className="flex items-center gap-3 mt-3">
              <Link
                href="/explainability"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                View Explanation
                <ChevronRight className="w-3 h-3" />
              </Link>
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <Clock className="w-3 h-3" />
                {formatTimestamp(alert.timestamp)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
