import React, { useState, useMemo, useEffect } from "react";
import { mockDB, ComparisonItem, ComparisonCategory } from "@/data/mockDB";
import GlassCard from "../GlassCard";
import { Zap, Shield, Star, DollarSign, Cpu, Gauge, History as HistoryIcon, Trophy, Globe, Activity, LayoutList } from "lucide-react";
import LoadingScreen from "./LoadingScreen";
import AIVerdict from "./AIVerdict";
import SearchSelector from "./SearchSelector";
import PreferenceTuner from "./PreferenceTuner";
import ComparisonRadar from "./ComparisonRadar";
import ComparisonTable from "./ComparisonTable";
import SocialPulse from "./SocialPulse";
import DuelHistory from "./DuelHistory";
import { Button } from "@/components/ui/button";

const metricIcons: Record<string, any> = {
  safety: Shield, budget: DollarSign, value: DollarSign, culture: Globe,
  power: Cpu, speed: Gauge, history: HistoryIcon, tech: Zap, fans: Star,
  research: Activity, campus: Globe, prestige: Trophy, network: Activity,
  jobs: Activity, rent: DollarSign, camera: Activity, performance: Cpu,
  battery: Zap, display: LayoutList
};

const DuelEngine = () => {
  const [activeCategory, setActiveCategory] = useState<ComparisonCategory>("tech");
  const [itemA, setItemA] = useState<ComparisonItem>(mockDB.find(i => i.category === "tech")!);
  const [itemB, setItemB] = useState<ComparisonItem>(mockDB.filter(i => i.category === "tech")[1]!);
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  
  const initialWeights = useMemo(() => {
    const keys = Object.keys(itemA.metrics);
    return keys.reduce((acc, key) => ({ ...acc, [key]: 5 }), {});
  }, [activeCategory]);

  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);

  const availableItems = useMemo(() => mockDB.filter(item => item.category === activeCategory), [activeCategory]);

  const switchCategory = (cat: ComparisonCategory) => {
    setActiveCategory(cat);
    const items = mockDB.filter(i => i.category === cat);
    setItemA(items[0]);
    setItemB(items[1]);
    setShowResult(false);
    const keys = Object.keys(items[0].metrics);
    setWeights(keys.reduce((acc, key) => ({ ...acc, [key]: 5 }), {}));
  };

  const startDuel = () => {
    setIsSearching(true);
    setShowResult(false);
  };

  const handleDuelComplete = () => {
    setIsSearching(false);
    setShowResult(true);
    
    // Add to history
    const newHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      nameA: itemA.name,
      nameB: itemB.name,
      category: activeCategory,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
  };

  const ItemCard = ({ item, side }: { item: ComparisonItem, side: 'left' | 'right' }) => (
    <div className="flex flex-col gap-4 w-full">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-4 left-4 flex gap-1">
          {item.highlights.map(h => (
            <span key={h} className="bg-black/60 backdrop-blur-md text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-white/10">{h}</span>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {isSearching && <LoadingScreen onComplete={handleDuelComplete} />}
      
      <DuelHistory history={history} onClear={() => setHistory([])} />

      <div className="flex justify-center flex-wrap gap-2 mb-12">
        {["tech", "travel", "sports", "education", "living"].map((cat) => (
          <button
            key={cat}
            onClick={() => switchCategory(cat as ComparisonCategory)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeCategory === cat 
                ? "bg-blue-600 border-blue-500 text-white shadow-xl" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <PreferenceTuner 
        metrics={Object.keys(itemA.metrics)} 
        weights={weights} 
        onWeightChange={(m, v) => setWeights(prev => ({ ...prev, [m]: v }))}
      />

      {!showResult && !isSearching && (
        <div className="flex justify-center mb-16 relative z-10">
          <Button 
            onClick={startDuel}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-12 py-8 text-2xl font-black uppercase italic tracking-tighter shadow-2xl transition-all hover:scale-105"
          >
            <Zap className="w-8 h-8 mr-4 fill-white" />
            INITIATE DUEL
          </Button>
        </div>
      )}

      {showResult && (
        <div className="space-y-12 mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
          <AIVerdict itemA={itemA} itemB={itemB} weights={weights} />
          
          <SocialPulse itemA={itemA} itemB={itemB} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ComparisonRadar itemA={itemA} itemB={itemB} />
            <ComparisonTable itemA={itemA} itemB={itemB} />
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Neural Performance Drift</h4>
            {Object.keys(itemA.metrics).map(metric => (
              <div key={metric} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span className="text-blue-400">{itemA.name}: {itemA.metrics[metric]}%</span>
                  <span className="text-white/40">{metric}</span>
                  <span className="text-purple-400">{itemB.name}: {itemB.metrics[metric]}%</span>
                </div>
                <div className="flex gap-1 h-1">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${itemA.metrics[metric]}%` }} />
                  <div className="flex-1 h-full bg-white/5" />
                  <div className="h-full bg-purple-500 transition-all" style={{ width: `${itemB.metrics[metric]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12 items-start opacity-40 hover:opacity-100 transition-opacity">
        <ItemCard item={itemA} side="left" />
        <div className="hidden lg:flex flex-col items-center justify-center pt-24">
          <div className="bg-white/10 px-4 py-2 rounded-full font-black text-xl italic text-white/20">VS</div>
        </div>
        <ItemCard item={itemB} side="right" />
      </div>
    </div>
  );
};

export default DuelEngine;