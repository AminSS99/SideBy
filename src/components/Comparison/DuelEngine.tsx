import React, { useState, useMemo } from "react";
import { mockDB, ComparisonItem, ComparisonCategory } from "@/data/mockDB";
import GlassCard from "../GlassCard";
import { Zap, Shield, Star, DollarSign, Cpu, Gauge, History, Trophy, Globe } from "lucide-react";
import LoadingScreen from "./LoadingScreen";
import AIVerdict from "./AIVerdict";
import SearchSelector from "./SearchSelector";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const metricIcons: Record<string, any> = {
  safety: Shield,
  budget: DollarSign,
  value: DollarSign,
  culture: Globe,
  power: Cpu,
  speed: Gauge,
  history: History,
  tech: Zap,
  fans: Star,
};

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
    setItemB(items[items.length > 1 ? 1 : 0]);
    setShowResult(false);
  };

  const startDuel = () => {
    setIsSearching(true);
    setShowResult(false);
  };

  const ItemCard = ({ item, side }: { item: ComparisonItem, side: 'left' | 'right' }) => (
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SearchSelector 
        label={`Contender ${side === 'left' ? 'A' : 'B'}`}
        items={availableItems}
        selectedItem={item}
        onSelect={(newItem) => {
          side === 'left' ? setItemA(newItem) : setItemB(newItem);
          setShowResult(false);
        }}
      />

      <GlassCard className="relative h-64 p-0 group overflow-hidden border-white/10 shadow-2xl">
        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          {item.highlights.map(h => (
            <span key={h} className="bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md text-white/80">
              {h}
            </span>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-2">
        {Object.entries(item.metrics).map(([key, val]) => {
          const Icon = metricIcons[key] || Star;
          return (
            <div key={key} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black text-white/40 flex items-center gap-2">
                  <Icon className="w-3 h-3 text-blue-400" />
                  {key}
                </span>
                <span className="text-xs font-black italic">{val}%</span>
              </div>
              <Progress value={val as number} className="h-1 bg-white/5" />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {isSearching && <LoadingScreen onComplete={() => { setIsSearching(false); setShowResult(true); }} />}

      <div className="flex justify-center flex-wrap gap-2 mb-16">
        {["travel", "sports", "tech", "cars"].map((cat) => (
          <button
            key={cat}
            onClick={() => switchCategory(cat as ComparisonCategory)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeCategory === cat 
                ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {!showResult && !isSearching && (
        <div className="flex justify-center mb-16 relative z-10">
          <Button 
            onClick={startDuel}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-12 py-8 text-2xl font-black uppercase italic tracking-tighter shadow-2xl transition-all hover:scale-105 active:scale-95 group"
          >
            <Zap className="w-8 h-8 mr-4 fill-white animate-pulse" />
            RUN NEURAL SCAN
          </Button>
        </div>
      )}

      {showResult && (
        <div className="mb-20">
          <AIVerdict cityA={itemA as any} cityB={itemB as any} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <ItemCard item={itemA} side="left" />
        <div className="hidden lg:flex flex-col items-center justify-center pt-32 gap-4 sticky top-40">
          <div className="h-20 w-px bg-gradient-to-b from-transparent to-blue-500" />
          <div className="bg-blue-600/10 border border-blue-500/50 px-4 py-2 rounded-full font-black text-xl italic text-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
            VS
          </div>
          <div className="h-20 w-px bg-gradient-to-t from-transparent to-blue-500" />
        </div>
        <ItemCard item={itemB} side="right" />
      </div>
    </div>
  );
};

export default DuelEngine;