import React from "react";
import { Newspaper, Zap, Clock, ExternalLink } from "lucide-react";

interface NewsItem {
  id: string;
  source: string;
  headline: string;
  time: string;
  sentiment: "positive" | "negative" | "neutral";
}

const NeuralNewsFeed = ({ itemA, itemB, category }: { itemA: any, itemB: any, category: string }) => {
  const news: NewsItem[] = [
    {
      id: "1",
      source: "Global Reuters",
      headline: `${itemA.name} announces major infrastructure overhaul for 2026.`,
      time: "14m ago",
      sentiment: "positive"
    },
    {
      id: "2",
      source: "TechPulse",
      headline: `Supply chain bottlenecks reported for ${itemB.name} components.`,
      time: "1h ago",
      sentiment: "negative"
    },
    {
      id: "3",
      source: "MarketWatch",
      headline: `Institutional investors increase stake in ${itemA.category} sector leaders.`,
      time: "3h ago",
      sentiment: "neutral"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-3 h-3 text-white/20" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Neural News Wire</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Live Feed</span>
        </div>
      </div>

      <div className="space-y-2">
        {news.map((item) => (
          <div key={item.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter">{item.source}</span>
              <div className="flex items-center gap-1 text-white/20">
                <Clock className="w-2 h-2" />
                <span className="text-[8px] font-bold">{item.time}</span>
              </div>
            </div>
            <p className="text-xs font-medium text-white/70 group-hover:text-white transition-colors line-clamp-2">
              {item.headline}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-[8px] font-black uppercase tracking-widest ${
                item.sentiment === 'positive' ? 'text-emerald-400' : 
                item.sentiment === 'negative' ? 'text-red-400' : 'text-white/30'
              }`}>
                {item.sentiment} IMPACT
              </span>
              <ExternalLink className="w-3 h-3 text-white/10 group-hover:text-white/40 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeuralNewsFeed;