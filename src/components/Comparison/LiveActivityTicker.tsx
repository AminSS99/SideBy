import React from "react";
import { Activity, Zap, TrendingUp, Users } from "lucide-react";

const LiveActivityTicker = () => {
  const activities = [
    "NEURAL SYNC: HAMBURG VS TOKYO [74% MATCH]",
    "DATA INGEST: S24 ULTRA FIRMWARE V2.1",
    "SENTIMENT SHIFT: REAL MADRID (+4.2%)",
    "NEW DUEL: HARVARD VS STANFORD",
    "SYSTEM STATUS: ALL NODES OPERATIONAL",
    "TRENDING: IPHONE 15 PRO TITANIUM DURABILITY",
  ];

  return (
    <div className="w-full bg-blue-600/10 border-y border-white/5 py-2 overflow-hidden mb-8 relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050505] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050505] to-transparent z-10" />
      
      <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap gap-12 items-center">
        {[...activities, ...activities].map((text, i) => (
          <div key={i} className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 italic">
              {text}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default LiveActivityTicker;