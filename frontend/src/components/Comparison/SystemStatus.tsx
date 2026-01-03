import React from "react";
import { Sparkles, Zap } from "lucide-react";

const SystemStatus = ({ credits = 5 }: { credits?: number }) => {
  return (
    <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold">
          <span className={credits === 0 ? "text-red-400" : "text-emerald-400"}>
            {credits}
          </span>
          <span className="text-white/40"> / 5 credits</span>
        </span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-white/40">AI Online</span>
      </div>
    </div>
  );
};

export default SystemStatus;