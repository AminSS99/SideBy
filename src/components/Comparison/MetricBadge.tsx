import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MetricBadgeProps {
  label: string;
  score: number;
  icon: React.ReactNode;
}

const MetricBadge = ({ label, score, icon }: MetricBadgeProps) => {
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
      <span className="text-white/60">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      <span className={cn(
        "ml-1 text-xs font-bold px-2 py-0.5 rounded-full",
        score > 85 ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
      )}>
        {score}
      </span>
    </div>
  );
};

export default MetricBadge;