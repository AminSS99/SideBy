import React, { useState, useMemo } from "react";
import { mockDB, ComparisonItem, ComparisonCategory } from "@/data/mockDB";
import GlassCard from "../GlassCard";
import { Zap, Trophy, TrendingUp, Star, Shield, Search } from "lucide-react";
import LoadingScreen from "./LoadingScreen";
import AIVerdict from "./AIVerdict";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DuelEngine = () => {
  const [activeCategory, setActiveCategory] = useState<ComparisonCategory>("travel");
  const [itemA, setItemA] = useState<ComparisonItem>(mockDB.find(i => i.category === "travel")!);
  const [itemB, setItemB] = useState<ComparisonItem>(mockDB.filter(i => i.category === "travel")[1]!);
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(true);

  const availableItems = useMemo(() => 
    mockDB.filter(item => item.category === activeCategory),
    [activeCategory]
  );

  const switchCategory = (cat: ComparisonCategory) => {
    setActiveCategory(cat);
    const items = mockDB.filter(i => i.category === cat);
    setItemA(items[0]);
    setItemB(items[1]);
    setShowResult(false);
  };

  const startDuel = () => {
    setIsSearching(true);
    setShowResult(false);
  };

  const ItemCard = ({ item }: { item: ComparisonItem }) => (
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="relative h-64 p-0 group overflow-hidden border-white/5">
        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{item.subtext}</p>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter">{item.name}</h3>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-3">
        {Object.entries(item.metrics).filter(([k]) => typeof item.metrics[k] === 'number').map(([key, val]) => (
          <div key={key} className="bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold text-white/40">{key}</span>
              <span className="text-xs font-black">{val}%</span>
            </div>
            <Progress value={val as number} className="h-1 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {isSearching && <LoadingScreen onComplete={() => { setIsSearching(false); setShowResult(true); }} />}

      {/* Category Navigation */}
      <div className="flex justify-center gap-4 mb-12">
        {["travel", "sports", "education", "living"].map((cat) => (
          <button
            key={cat}
            onClick={() => switchCategory(cat as ComparisonCategory)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeCategory === cat 
                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {!showResult && !isSearching && (
        <div className="flex justify-center mb-12">
          <Button 
            onClick={startDuel}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-xl font-black uppercase italic tracking-tighter shadow-2xl transition-all hover:scale-105"
          >
            <Zap className="w-6 h-6 mr-2 fill-white" />
            COMPARE {activeCategory}
          </Button>
        </div>
      )}

      {showResult && (
        <div className="mb-12">
          <AIVerdict cityA={itemA as any} cityB={itemB as any} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <ItemCard item={itemA} />
        <div className="hidden lg:flex items-center justify-center">
          <div className="text-2xl font-black italic text-white/10">VS</div>
        </div>
        <ItemCard item={itemB} />
      </div>
    </div>
  );
};

export default DuelEngine;