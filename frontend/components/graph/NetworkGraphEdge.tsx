"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import type { NetworkEdge } from "@/types";

export const NetworkGraphEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd,
  }: EdgeProps<NetworkEdge>) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const risk = data?.riskScore ?? 0;
    const isSuspicious = data?.isSuspicious ?? false;

    const strokeColor =
      isSuspicious
        ? risk >= 0.8 ? "#ef4444" : "#f97316"
        : risk >= 0.5 ? "#f59e0b" : "#334155";

    const strokeWidth = isSuspicious ? 2.5 : 1.5;

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            stroke: selected ? "#93c5fd" : strokeColor,
            strokeWidth: selected ? 3 : strokeWidth,
            strokeDasharray: isSuspicious ? "6 3" : undefined,
            filter: isSuspicious ? `drop-shadow(0 0 4px ${strokeColor}88)` : undefined,
            opacity: 0.85,
          }}
        />

        {/* Edge label on hover / selected */}
        {selected && data && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
              }}
              className="nodrag nopan"
            >
              <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-[10px] shadow-xl min-w-[120px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: strokeColor }}
                  />
                  <span className="text-slate-300 font-semibold uppercase tracking-wide">
                    {data.protocol}/{data.port}
                  </span>
                  {isSuspicious && (
                    <span className="ml-auto text-red-400 font-bold text-[9px]">SUSPICIOUS</span>
                  )}
                </div>
                <div className="space-y-0.5 text-slate-400">
                  <div className="flex justify-between gap-3">
                    <span>Packets</span>
                    <span className="text-slate-200 font-mono">{data.packetCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Bytes</span>
                    <span className="text-slate-200 font-mono">
                      {data.byteCount > 1_000_000
                        ? `${(data.byteCount / 1_000_000).toFixed(1)}MB`
                        : `${(data.byteCount / 1_000).toFixed(1)}KB`}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Freq</span>
                    <span className="text-slate-200 font-mono">{data.connectionFrequency}/win</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Risk</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: strokeColor }}
                    >
                      {Math.round(risk * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

NetworkGraphEdge.displayName = "NetworkGraphEdge";
