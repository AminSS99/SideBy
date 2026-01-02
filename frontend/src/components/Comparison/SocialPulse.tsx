import React from "react";
import { TrendingUp, TrendingDown, Minus, MessageSquare } from "lucide-react";

interface SocialPulseProps {
  itemA: any;
  itemB: any;
}

const SocialPulse = ({ itemA, itemB }: SocialPulseProps) => {
  const PulseItem = ({ item }: { item: any }) => (
    <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white/20" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Social Sentiment</span>
        </div>
        {item.sentiment.trending === 'up' ? (
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        ) : item.sentiment.trending === 'down' ? (
          <TrendingDown className="w-4 h-4 text-red-400" />
        ) : (
          <Minus className="w-4 h-4 text-white/20" />
        )}
      </div>

      <div className="flex gap-1 h-3 mb-4 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500/60" style={{ width: `${item.sentiment.positive}%` }} />
        <div className="h-full bg-white/10" style={{ width: `${item.sentiment.neutral}%` }} />
        <div className="h-full bg-red-500/60" style={{ width: `${item.sentiment.negative}%` }} />
      </div>

      <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
        <span className="text-emerald-400">{item.sentiment.positive}% Positive</span>
        <span className="text-white/20">{item.sentiment.neutral}% Neutral</span>
        <span className="text-red-400">{item.sentiment.negative}% Critical</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-12">
      <PulseItem item={itemA} />
      <PulseItem item={itemB} />
    </div>
  );
};

export default SocialPulse;