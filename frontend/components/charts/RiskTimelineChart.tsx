"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { RISK_TIMELINE_DATA } from "@/lib/mockData";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const risk = payload[0].value;
  const color = risk >= 80 ? "#ef4444" : risk >= 60 ? "#f59e0b" : risk >= 30 ? "#eab308" : "#22c55e";
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-base font-bold" style={{ color }}>{risk}%</p>
    </div>
  );
}

export function RiskTimelineChart({
  data = RISK_TIMELINE_DATA,
  height = 180,
}: {
  data?: typeof RISK_TIMELINE_DATA;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} />
        <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
        <Line
          type="monotone"
          dataKey="risk"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
