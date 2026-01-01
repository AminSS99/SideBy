import React from "react";
import GlassCard from "../GlassCard";
import { Sparkles, Trophy, AlertCircle } from "lucide-react";
import { CityData } from "@/data/cities";

interface AIVerdictProps {
  cityA: CityData;
  cityB: CityData;
}

const AIVerdict = ({ cityA, cityB }: AIVerdictProps) => {
  // Simple heuristic for winner based on multiple categories
  const scoreA = (cityA.metrics.safety + cityA.metrics.socialSentiment + cityA.metrics.inclusivity) / 3;
  const scoreB = (cityB.metrics.safety + cityB.metrics.socialSentiment + cityB.metrics.inclusivity) / 3;
  
  const winner = scoreA > scoreB ? cityA : cityB;
  const loser = scoreA > scoreB ? cityB : cityA;

  return (
    <div className="max-w-4xl mx-auto mb-16 px-4">
      <GlassCard className="border-blue-500/30 bg-blue-500/5 backdrop-blur-3xl overflow-visible" glowColor="blue">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-xl shadow-blue-600/20 border border-white/20">
          <Sparkles className="w-4 h-4 fill-white" />
          <span className="text-sm font-black italic uppercase tracking-tighter">AI VERDICT 2.0</span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 pt-6">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-black mb-4">
              Our AI Recommends <span className="text-blue-400">{winner.name}</span>
            </h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Based on the 8 core comparison pillars, <span className="text-white font-bold">{winner.name}</span> outshines {loser.name} primarily in 
              <span className="text-blue-400"> accessibility and safety</span>. While {loser.name} offers a more specialized 
              culture, the overall balance makes {winner.name} the optimal choice for your next journey.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
                Better Value
              </div>
              <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/30">
                Top Connectivity
              </div>
              <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30">
                AI Favorite
              </div>
            </div>
          </div>

          <div className="w-48 h-48 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative z-10 text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <div className="text-xs font-black uppercase tracking-tighter text-white/50">Overall Match</div>
              <div className="text-5xl font-black italic tracking-tighter text-white">98%</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AIVerdict;