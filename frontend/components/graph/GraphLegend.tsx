"use client";

export function GraphLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 backdrop-blur-sm text-xs space-y-3">
      <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Legend</p>

      <div className="space-y-1.5">
        <p className="text-slate-500 text-[10px] uppercase tracking-wide">Node Type</p>
        {[
          { color: "bg-blue-400",   label: "Host" },
          { color: "bg-purple-400", label: "Server" },
          { color: "bg-cyan-400",   label: "Database" },
          { color: "bg-slate-400",  label: "Router" },
          { color: "bg-green-400",  label: "IoT Device" },
          { color: "bg-red-400",    label: "External" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 pt-2 space-y-1.5">
        <p className="text-slate-500 text-[10px] uppercase tracking-wide">Edge Risk</p>
        {[
          { color: "#334155", label: "Low" },
          { color: "#f59e0b", label: "Medium" },
          { color: "#f97316", label: "High" },
          { color: "#ef4444", label: "Critical / Suspicious", dashed: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <svg width="20" height="8">
              <line
                x1="0" y1="4" x2="20" y2="4"
                stroke={item.color}
                strokeWidth="2"
                strokeDasharray={item.dashed ? "4 2" : undefined}
              />
            </svg>
            <span className="text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
          <span className="text-slate-400">Suspicious node</span>
        </div>
      </div>
    </div>
  );
}
