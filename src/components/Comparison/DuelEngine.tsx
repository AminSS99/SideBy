import React, { useState, useMemo } from "react";
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
import PersonaPresets from "./PersonaPresets";
import ContenderGallery from "./ContenderGallery";
import LiveActivityTicker from "./LiveActivityTicker";
import WinConditions from "./WinConditions";
import DomainIntel from "./DomainIntel";
import { Button } from "@/components/ui/button";

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
    
    setHistory(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      nameA: itemA.name,
      nameB: itemB.name,
      category: activeCategory,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev].slice(0, 10));
  };

  const ItemCard = ({ item, side }: { item: ComparisonItem, side: 'left' | 'right' }) => (
    <div className="flex flex-col gap-4 w-full group">
      <SearchSelector 
        label={`Contender ${side === 'left' ? 'A' : 'B'}`}
        items={availableItems}
        selectedItem={item}
        onSelect={(newItem) => {
          side === 'left' ? setItemA(newItem) : setItemB(newItem);
          setShowResult(false);
        }}
      />
      <div className="relative h-64 rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all group-hover:border-blue-500/30">
        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
        
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(59,130,246,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-[pulse_2s_infinite] pointer-events-none" />
        
        <div className="absolute bottom-4 left-4 flex gap-1">
          {item.highlights.map(h => (
            <span key={h} className="bg-black/60 backdrop-blur-md text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-white/10 text-white/80">{h}</span>
          ))}
        </div>
      </div>
      <DomainIntel item={item} category={activeCategory} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <LiveActivityTicker />
      
      {isSearching && <LoadingScreen onComplete={handleDuelComplete} />}
      
      <DuelHistory history={history} onClear={() => setHistory([])} />

      <div className="flex justify-center flex-wrap gap-2 mb-12">
        {["tech", "travel", "sports", "education", "living"].map((cat) => (
          <button
            key={cat}
            onClick={() => switchCategory(cat as ComparisonCategory)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeCategory === cat 
                ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mb-12">
        <PersonaPresets category={activeCategory} onApply={(w) => {
          setWeights(w);
          setShowResult(false);
        }} />
        <PreferenceTuner 
          metrics={Object.keys(itemA.metrics)} 
          weights={weights} 
          onWeightChange={(m, v) => setWeights(prev => ({ ...prev, [m]: v }))}
        />
      </div>

      {!showResult && !isSearching && (
        <div className="flex justify-center mb-16 relative z-10">
          <Button 
            onClick={startDuel}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-12 py-8 text-2xl font-black uppercase italic tracking-tighter shadow-2xl shadow-blue-600/20 transition-all hover:scale-105"
          >
            <Zap className="w-8 h-8 mr-4 fill-white" />
            SYNTHESIZE VERDICT
          </Button>
        </div>
      )}

      {showResult && (
        <div className="space-y-12 mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
          <AIVerdict itemA={itemA} itemB={itemB} weights={weights} />
          
          <WinConditions itemA={itemA} itemB={itemB} />

          <SocialPulse itemA={itemA} itemB={itemB} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ComparisonRadar itemA={itemA} itemB={itemB} />
            <ComparisonTable itemA={itemA} itemB={itemB} />
          </div>

          <ContenderGallery itemA={itemA} itemB={itemB} />

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Neural Performance Drift</h4>
            {Object.keys(itemA.metrics).map(metric => (
              <div key={metric} className="bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span className="text-blue-400">{itemA.name}: {itemA.metrics[metric]}%</span>
                  <span className="text-white/40 group-hover:text-white/60 transition-colors">{metric}</span>
                  <span className="text-purple-400">{itemB.name}: {itemB.metrics[metric]}%</span>
                </div>
                <div className="flex gap-1 h-1">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${itemA.metrics[metric]}%` }} />
                  <div className="flex-1 h-full bg-white/5" />
                  <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${itemB.metrics[metric]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12 items-start opacity-40 hover:opacity-100 transition-all duration-500">
        <ItemCard item={itemA} side="left" />
        <div className="hidden lg:flex flex-col items-center justify-center pt-24">
          <div className="bg-white/10 px-4 py-2 rounded-full font-black text-xl italic text-white/20 border border-white/5">VS</div>
        </div>
        <ItemCard item={itemB} side="right" />
      </div>
    </div>
  );
};

export default DuelEngine;