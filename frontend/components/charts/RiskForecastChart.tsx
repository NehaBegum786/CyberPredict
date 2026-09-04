"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { FORECAST_CHART_DATA } from "@/lib/mockData";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: (typeof FORECAST_CHART_DATA)[0] }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{Math.round(d.risk)}%</p>
      <p className="text-xs text-slate-500 mt-1">
        Confidence: {Math.round(d.confidence * 100)}%
      </p>
      <p className={`text-xs mt-1 font-medium ${d.type === "observed" ? "text-blue-400" : "text-red-400"}`}>
        {d.type === "observed" ? "Observed" : "Forecast (Demo)"}
      </p>
    </div>
  );
}

interface RiskForecastChartProps {
  data?: typeof FORECAST_CHART_DATA;
  height?: number;
  compact?: boolean;
}

export function RiskForecastChart({
  data = FORECAST_CHART_DATA,
  height = 240,
  compact = false,
}: RiskForecastChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="observedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Threshold lines */}
        <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: "Low", fill: "#22c55e", fontSize: 10, position: "right" }} />
        <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: "Medium", fill: "#f59e0b", fontSize: 10, position: "right" }} />
        <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: "High", fill: "#ef4444", fontSize: 10, position: "right" }} />

        <Area
          type="monotone"
          dataKey="risk"
          stroke="#3b82f6"
          strokeWidth={2.5}
          fill="url(#riskGradient)"
          dot={(props) => {
            const { cx, cy, payload } = props;
            const isForecast = payload.type === "forecast";
            return (
              <circle
                key={`dot-${payload.label}`}
                cx={cx}
                cy={cy}
                r={5}
                fill={isForecast ? "#ef4444" : "#3b82f6"}
                stroke={isForecast ? "#fca5a5" : "#93c5fd"}
                strokeWidth={2}
              />
            );
          }}
          activeDot={{ r: 7, fill: "#ef4444", stroke: "#fca5a5", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
