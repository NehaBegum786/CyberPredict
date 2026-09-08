import { AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { cn } from "@/lib/utils";

interface AttackBreakdown {
  [attackType: string]: {
    count: number;
    percentage: number;
  };
}

interface AttackStatisticsProps {
  totalRecords: number;
  benignCount: number;
  attackCount: number;
  attackPercentage: number;
  attackBreakdown: AttackBreakdown;
}

export function AttackStatistics({
  totalRecords,
  benignCount,
  attackCount,
  attackPercentage,
  attackBreakdown,
}: AttackStatisticsProps) {
  // Sort attacks by count
  const sortedAttacks = Object.entries(attackBreakdown).sort(
    (a, b) => b[1].count - a[1].count
  );

  // Color based on attack percentage
  const getRiskColor = (percentage: number) => {
    if (percentage < 5) return "text-green-400";
    if (percentage < 15) return "text-yellow-400";
    if (percentage < 30) return "text-orange-400";
    return "text-red-400";
  };

  const getRiskLevel = (percentage: number) => {
    if (percentage < 5) return "LOW";
    if (percentage < 15) return "MEDIUM";
    if (percentage < 30) return "HIGH";
    return "CRITICAL";
  };

  const riskColor = getRiskColor(attackPercentage);
  const riskLevel = getRiskLevel(attackPercentage);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-white">
                  {totalRecords.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Benign Traffic
                </p>
                <p className="text-2xl font-bold text-white">
                  {benignCount.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">
                  {((benignCount / totalRecords) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "bg-slate-800/50 border",
            attackPercentage < 5
              ? "border-green-500/20"
              : attackPercentage < 15
              ? "border-yellow-500/20"
              : attackPercentage < 30
              ? "border-orange-500/20"
              : "border-red-500/20"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  attackPercentage < 5
                    ? "bg-green-500/10 border border-green-500/20"
                    : attackPercentage < 15
                    ? "bg-yellow-500/10 border border-yellow-500/20"
                    : attackPercentage < 30
                    ? "bg-orange-500/10 border border-orange-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                )}
              >
                <AlertTriangle className={cn("w-5 h-5", riskColor)} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Attacks Detected
                </p>
                <p className="text-2xl font-bold text-white">
                  {attackCount.toLocaleString()}
                </p>
                <p className={cn("text-xs font-semibold", riskColor)}>
                  {attackPercentage.toFixed(2)}% - {riskLevel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attack Breakdown */}
      {sortedAttacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attack Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedAttacks.map(([attackType, data]) => (
                <div key={attackType} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">
                      {attackType}
                    </span>
                    <span className="text-slate-400">
                      {data.count.toLocaleString()} ({data.percentage.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(data.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sortedAttacks.length === 0 && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-green-300 mb-1">
              No Attacks Detected
            </p>
            <p className="text-sm text-slate-400">
              All traffic appears to be benign
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
