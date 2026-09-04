"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Network,
  TrendingUp,
  GitFork,
  Brain,
  BookOpen,
  Cpu,
  Settings,
  Shield,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/traffic-analyzer", label: "Traffic Analyzer", icon: Upload },
  { href: "/network-graph", label: "Network Graph", icon: Network },
  { href: "/attack-forecast", label: "Attack Forecast", icon: TrendingUp },
  { href: "/attack-paths", label: "Attack Paths", icon: GitFork },
  { href: "/explainability", label: "Explainability", icon: Brain },
  { href: "/research", label: "Research", icon: BookOpen },
  { href: "/architecture", label: "Architecture", icon: Cpu },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen flex flex-col bg-[#080d1a] border-r border-slate-800/80 shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">CyberPredict</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">AI Forecasting</p>
          </div>
        </Link>
      </div>

      {/* Demo mode indicator */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">Demo Forecast Mode</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                active
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="flex-1 font-medium">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-500/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Alert indicator */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">Active Alerts</p>
            <p className="text-xs text-red-300 font-mono">7 forecast alerts</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-3 font-mono">
          SIH26153 Research Prototype
        </p>
      </div>
    </aside>
  );
}
