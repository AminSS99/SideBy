import React from "react";
import GlassCard from "../GlassCard";
import { Sparkles, Trophy, Share2, ArrowRight, CheckCircle2 } from "lucide-react";
import { ComparisonItem } from "@/data/mockDB";
import { Button } from "@/components/ui/button";

interface AIVerdictProps {
  itemA: ComparisonItem;
  itemB: ComparisonItem;
  weights: Record<string, number>;
}

const AIVerdict = ({ itemA, itemB, weights }: AIVerdictProps) => {
  const calculateScore = (item: ComparisonItem) => {
    let totalWeight = 0;
    let weightedSum = 0;
    
    Object.keys(item.metrics).forEach(metric => {
      const weight = weights[metric] || 5;
      weightedSum += (item.metrics[metric] * weight);
      totalWeight += weight;
    });
    
    return weightedSum / totalWeight;
  };

  const scoreA = calculateScore(itemA);
  const scoreB = calculateScore(itemB);
  
  const winner = scoreA > scoreB ? itemA : itemB;
  const matchPercentage = Math.round(Math.max(scoreA, scoreB));

  const recommendations = winner.category === 'tech' ? [
    "Purchase during the Q3 Refresh cycle for maximum value.",
    "Pair with official ecosystem accessories for 100% feature parity.",
    "Enroll in 'Neural Care' for 3-year hardware longevity."
  ] : [
    "Secure 'Safety Tier 1' quality verified sourcing.",
    "Compare local vs. global market liquidity.",
    "Sync for offline neural navigation protocols."
  ];

  return (
    <div className="max-w-4xl mx-auto mb-16 px-4">
      <GlassCard className="border-purple-500/30 bg-purple-500/5 backdrop-blur-3xl overflow-visible" glowColor="purple">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-emerald-500 text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-xl shadow-purple-600/20 border border-white/20">
          <Sparkles className="w-4 h-4 fill-white" />
          <span className="text-sm font-black italic uppercase tracking-tighter">AI NEURAL VERDICT</span>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-12 pt-8">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div>
              <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase italic leading-tight">
                Neural Match: <br/> <span className="text-emerald-400">{winner.name}</span>
              </h3>
              <p className="text-white/60 text-sm leading-relaxed font-medium">
                Based on your <span className="text-white font-bold italic">Neural Calibration</span>, 
                {winner.name} achieves superior trait-alignment in this sector.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Strategic Recommendations</h4>
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-white/80">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4">
              <Button variant="outline" size="sm" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase h-8 px-6">
                <Share2 className="w-3 h-3 mr-2" /> Share Report
              </Button>
              <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase h-8 px-6">
                Initiate Purchase <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>

          <div className="w-full lg:w-64 flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl border border-white/5">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-emerald-600/20 blur-3xl rounded-full animate-pulse" />
              <Trophy className="w-20 h-20 text-yellow-400 relative z-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-tighter text-white/50">Match Fidelity</div>
              <div className="text-6xl font-black italic tracking-tighter text-white">{matchPercentage}%</div>
              <div className="mt-4 h-1.5 w-32 bg-white/5 rounded-full overflow-hidden mx-auto">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-1000" 
                  style={{ width: `${matchPercentage}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AIVerdict;