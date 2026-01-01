import React from "react";
import GlassCard from "../GlassCard";
import { TrendingUp, Users, ArrowRight } from "lucide-react";

const trends = [
  { pair: ["iPhone 15 Pro", "S24 Ultra"], category: "Tech", duels: "12.4k", winner: "iPhone" },
  { pair: ["Harvard", "Oxford"], category: "Education", duels: "8.1k", winner: "Oxford" },
  { pair: ["Tokyo", "Hamburg"], category: "Travel", duels: "5.2k", winner: "Tokyo" },
  { pair: ["Real Madrid", "Man City"], category: "Sports", duels: "18.9k", winner: "Real Madrid" },
];

const Leaderboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 mb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter uppercase">Global Duel Trends</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live statistics from the SideBy network</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trends.map((trend, i) => (
          <GlassCard key={i} className="hover:border-orange-500/30 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded">
                {trend.category}
              </span>
              <div className="flex items-center gap-1 text-white/40">
                <Users className="w-3 h-3" />
                <span className="text-[10px] font-bold">{trend.duels}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-sm font-black italic tracking-tight truncate">{trend.pair[0]}</span>
              <span className="text-[10px] font-bold text-white/20">VS</span>
              <span className="text-sm font-black italic tracking-tight truncate text-right">{trend.pair[1]}</span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="text-[10px] font-bold text-white/40 uppercase">AI Fav: <span className="text-white">{trend.winner}</span></div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-orange-400 transition-colors" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;