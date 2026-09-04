"use client";

import { useState } from "react";
import { Settings, Save, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [backendUrl, setBackendUrl]   = useState("http://localhost:4000");
  const [mlUrl, setMlUrl]             = useState("http://localhost:8000");
  const [demoMode, setDemoMode]       = useState(true);
  const [horizons, setHorizons]       = useState(3);
  const [windowSize, setWindowSize]   = useState("5 min");
  const [saved, setSaved]             = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({
    label, desc, children,
  }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-5 h-5 text-slate-400" />
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Service Configuration</CardTitle></CardHeader>
        <CardContent className="divide-y divide-slate-800">
          <Field label="Backend API URL" desc="Express.js backend endpoint">
            <input
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="w-56 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </Field>
          <Field label="ML Service URL" desc="Python FastAPI ML service endpoint">
            <input
              value={mlUrl}
              onChange={(e) => setMlUrl(e.target.value)}
              className="w-56 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </Field>
          <Field label="Demo Forecast Mode" desc="Use MockPredictor instead of live ML service">
            <button
              onClick={() => setDemoMode((v) => !v)}
              className={cn(
                "relative w-12 h-6 rounded-full border transition-all",
                demoMode ? "bg-amber-500/20 border-amber-500/40" : "bg-slate-800 border-slate-700"
              )}
            >
              <span className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full transition-all",
                demoMode ? "left-6 bg-amber-400" : "left-0.5 bg-slate-500"
              )} />
            </button>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Forecast Configuration</CardTitle></CardHeader>
        <CardContent className="divide-y divide-slate-800">
          <Field label="Forecast Horizons" desc="Number of future windows to predict (1–5)">
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  onClick={() => setHorizons(n)}
                  className={cn(
                    "w-8 h-8 rounded-lg border text-xs font-bold transition-all",
                    horizons === n
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Default Window Size" desc="Graph snapshot time window">
            <div className="flex items-center gap-2">
              {["1 min","5 min","10 min","30 min"].map((w) => (
                <button
                  key={w}
                  onClick={() => setWindowSize(w)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs font-medium transition-all",
                    windowSize === w
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
          {saved ? "Saved!" : "Save Settings"}
        </Button>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Settings are stored in browser session only in this prototype.
        </p>
      </div>
    </div>
  );
}
