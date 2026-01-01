import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { mockDB, ComparisonItem, ComparisonCategory } from "@/data/mockDB";
import GlassCard from "../GlassCard";
import { Zap, Shield, Star, Trophy, LayoutList, Share2, Download, CheckCircle2 } from "lucide-react";
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
import ExpertPanel from "./ExpertPanel";
import MarketForecast from "./MarketForecast";
import NeuralNewsFeed from "./NeuralNewsFeed";
import DossierCompiler from "./DossierCompiler";
import SystemStatus from "./SystemStatus";
import { Button } from "@/components/ui/button";

const DuelEngine = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialCategory = (searchParams.get("cat") as ComparisonCategory) || "tech";
  const [activeCategory, setActiveCategory] = useState<ComparisonCategory>(initialCategory);
  
  const [itemA, setItemA] = useState<ComparisonItem>(
    mockDB.find(i => i.id === searchParams.get("a")) || 
    mockDB.find(i => i.category === initialCategory)!
  );
  const [itemB, setItemB] = useState<ComparisonItem>(
    mockDB.find(i => i.id === searchParams.get("b")) || 
    mockDB.filter(i => i.category === initialCategory)[1]!
  );

  const [isSearching, setIsSearching] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  
  const initialWeights = useMemo(() => {
    const keys = Object.keys(itemA.metrics);
    return keys.reduce((acc, key) => ({ ...acc, [key]: 5 }), {});
  }, [activeCategory]);

  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);

  const availableItems = useMemo(() => mockDB.filter(item => item.category === activeCategory), [activeCategory]);

  useEffect(() => {
    setSearchParams({ cat: activeCategory, a: itemA.id, b: itemB.id }, { replace: true });
  }, [activeCategory, itemA, itemB]);

  const switchCategory = (cat: ComparisonCategory) => {
    setActiveCategory(cat);
    const items = mockDB.filter(i => i.category === cat);
    setItemA(items[0]);
    setItemB(items[1]);
    setShowResult(false);
    setUserVote(null);
    const keys = Object.keys(items[0].metrics);
    setWeights(keys.reduce((acc, key) => ({ ...acc, [key]: 5 }), {}));
  };

  const startDuel = () => {
    setIsSearching(true);
    setShowResult(false);
  };

  const compileDossier = () => {
    setIsCompiling(true);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <LiveActivityTicker />
      </div>
      
      {isSearching && <LoadingScreen onComplete={handleDuelComplete} />}
      {isCompiling && <DossierCompiler onComplete={() => setIsCompiling(false)} />}
      
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
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
            <AIVerdict itemA={itemA} itemB={itemB} weights={weights} />
            <div className="flex gap-2 pb-6">
              <Button onClick={compileDossier} variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase h-10 px-6">
                <Download className="w-4 h-4 mr-2" /> Dossier
              </Button>
              <Button variant="outline" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white border-transparent text-[10px] font-black uppercase h-10 px-6">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
               <WinConditions itemA={itemA} itemB={itemB} />
               
               {/* User Intuition Voting */}
               <GlassCard className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h4 className="text-lg font-black italic uppercase tracking-tighter mb-1">Human Intuition Protocol</h4>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">How does your instinct compare to the Neural Engine?</p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => setUserVote('A')}
                        className={`rounded-2xl px-6 h-14 flex flex-col items-center justify-center transition-all ${
                          userVote === 'A' ? 'bg-blue-600 text-white scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase">Vote for</span>
                        <span className="text-sm font-black italic">{itemA.name}</span>
                      </Button>
                      <Button 
                        onClick={() => setUserVote('B')}
                        className={`rounded-2xl px-6 h-14 flex flex-col items-center justify-center transition-all ${
                          userVote === 'B' ? 'bg-purple-600 text-white scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase">Vote for</span>
                        <span className="text-sm font-black italic">{itemB.name}</span>
                      </Button>
                    </div>
                  </div>
               </GlassCard>

               <ExpertPanel category={activeCategory} itemA={itemA} itemB={itemB} />
            </div>
            <div className="space-y-8">
               <NeuralNewsFeed itemA={itemA} itemB={itemB} category={activeCategory} />
               <MarketForecast category={activeCategory} itemA={itemA} itemB={itemB} />
               <SocialPulse itemA={itemA} itemB={itemB} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ComparisonRadar itemA={itemA} itemB={itemB} />
            <ComparisonTable itemA={itemA} itemB={itemB} />
          </div>

          <ContenderGallery itemA={itemA} itemB={itemB} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12 items-start opacity-40 hover:opacity-100 transition-all duration-500">
        <div className="flex flex-col gap-4 w-full">
           <SearchSelector 
            label="Contender A"
            items={availableItems}
            selectedItem={itemA}
            onSelect={(newItem) => { setItemA(newItem); setShowResult(false); setUserVote(null); }}
          />
          <DomainIntel item={itemA} category={activeCategory} />
        </div>
        <div className="hidden lg:flex flex-col items-center justify-center pt-24">
          <div className="bg-white/10 px-4 py-2 rounded-full font-black text-xl italic text-white/20 border border-white/5">VS</div>
        </div>
        <div className="flex flex-col gap-4 w-full">
           <SearchSelector 
            label="Contender B"
            items={availableItems}
            selectedItem={itemB}
            onSelect={(newItem) => { setItemB(newItem); setShowResult(false); setUserVote(null); }}
          />
          <DomainIntel item={itemB} category={activeCategory} />
        </div>
      </div>
    </div>
  );
};

export default DuelEngine;