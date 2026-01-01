import React from "react";
import GlassCard from "../GlassCard";
import { Sparkles, Trophy, Share2, Bookmark } from "lucide-react";
import { ComparisonItem } from "@/data/mockDB";
import { Button } from "@/components/ui/button";

interface AIVerdictProps {
  itemA: ComparisonItem;
  itemB: ComparisonItem;
  weights: Record<string, number>;
}

const AIVerdict = ({ itemA, itemB, weights }: AIVerdictProps) => {
  // Weighted Scoring Algorithm
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
  const loser = scoreA > scoreB ? itemB : itemA;
  const matchPercentage = Math.round(Math.max(scoreA, scoreB));

  return (
    <div className="max-w-4xl mx-auto mb-16 px-4">
      <GlassCard className="border-blue-500/30 bg-blue-500/5 backdrop-blur-3xl overflow-visible" glowColor="blue">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-xl shadow-blue-600/20 border border-white/20">
          <Sparkles className="w-4 h-4 fill-white" />
          <span className="text-sm font-black italic uppercase tracking-tighter">AI NEURAL VERDICT</span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 pt-8">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase italic">
              Neural Match: <span className="text-blue-400">{winner.name}</span>
            </h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6 font-medium">
              Based on your <span className="text-white font-bold italic">Neural Calibration</span>, 
              {winner.name} achieves a superior balance of traits. While {loser.name} is competitive in specific niches, 
              the aggregate data suggests {winner.name} is the optimal choice for your priorities.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              <Button variant="outline" size="sm" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase h-8">
                <Share2 className="w-3 h-3 mr-2" /> Share Report
              </Button>
              <Button variant="outline" size="sm" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase h-8">
                <Bookmark className="w-3 h-3 mr-2" /> Save Duel
              </Button>
            </div>
          </div>

          <div className="w-48 h-48 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative z-10 text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <div className="text-[10px] font-black uppercase tracking-tighter text-white/50">Match Fidelity</div>
              <div className="text-5xl font-black italic tracking-tighter text-white">{matchPercentage}%</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AIVerdict;