import React from "react";
import { Activity, ShieldCheck, Zap, Server } from "lucide-react";

const SystemStatus = () => {
  return (
    <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-white/5 rounded-full border border-white/10">
      <div className="flex items-center gap-2">
        <Server className="w-3 h-3 text-blue-400" />
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-white/40 leading-none">Nodes</span>
          <span className="text-[10px] font-bold leading-tight">12 Online</span>
        </div>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-white/40 leading-none">Shield</span>
          <span className="text-[10px] font-bold leading-tight">Encrypted</span>
        </div>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <Zap className="w-3 h-3 text-yellow-400" />
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-white/40 leading-none">Latent</span>
          <span className="text-[10px] font-bold leading-tight">14ms</span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;