import React from "react";
import GlassCard from "../GlassCard";
import { MessageSquareQuote, ShieldAlert, Award, Microscope } from "lucide-react";

interface ExpertInsight {
  expert: string;
  role: string;
  avatar: string;
  quote: string;
  sentiment: "positive" | "neutral" | "critical";
}

const ExpertPanel = ({ category, itemA, itemB }: { category: string, itemA: any, itemB: any }) => {
  const travelExperts: ExpertInsight[] = [
    {
      expert: "Elena Vance",
      role: "Urban Anthropologist",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
      quote: `${itemA.name} offers a more cohesive social fabric, whereas ${itemB.name} excels in individualist expression.`,
      sentiment: "positive"
    },
    {
      expert: "Marcus Thorne",
      role: "Logistics Specialist",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
      quote: `Connectivity-wise, ${itemB.name} is the global hub, but ${itemA.name} wins on local efficiency.`,
      sentiment: "neutral"
    }
  ];

  const techExperts: ExpertInsight[] = [
    {
      expert: "Dr. Aris",
      role: "Hardware Architect",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aris",
      quote: `The silicon efficiency in ${itemA.name} is peerless, but ${itemB.name} has superior thermal headroom.`,
      sentiment: "positive"
    },
    {
      expert: "Sarah Chen",
      role: "UX Researcher",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      quote: `Users report higher long-term satisfaction with ${itemB.name}'s open ecosystem approach.`,
      sentiment: "positive"
    }
  ];

  const experts = category === "travel" ? travelExperts : category === "tech" ? techExperts : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Microscope className="w-3 h-3 text-white/20" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Expert Intelligence Panel</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {experts.map((e, i) => (
          <GlassCard key={i} className="flex gap-4 items-start border-white/5 bg-white/[0.02]">
            <img src={e.avatar} alt={e.expert} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 shadow-lg" />
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-xs font-black italic text-purple-400">{e.expert}</p>
                <MessageSquareQuote className="w-3 h-3 text-white/10" />
              </div>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">{e.role}</p>
              <p className="text-xs text-white/70 leading-relaxed font-medium">"{e.quote}"</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default ExpertPanel;