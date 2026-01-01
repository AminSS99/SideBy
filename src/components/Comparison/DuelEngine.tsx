import React, { useState, useMemo, useEffect } from "react";
import { mockDB, ComparisonItem, ComparisonCategory, generateSyntheticItem } from "@/data/mockDB";
import GlassCard from "../GlassCard";
import { Zap, Share2, Download, Search, Lock, AlertTriangle } from "lucide-react";
import LoadingScreen from "./LoadingScreen";
import AIVerdict from "./AIVerdict";
import PreferenceTuner from "./PreferenceTuner";
import ComparisonRadar from "./ComparisonRadar";
import ComparisonTable from "./ComparisonTable";
import SocialPulse from "./SocialPulse";
import DuelHistory from "./DuelHistory";
import PersonaPresets from "./PersonaPresets";
import ContenderGallery from "./ContenderGallery";
import LiveActivityTicker from "./LiveActivityTicker";
import WinConditions from "./WinConditions";
import ExpertPanel from "./ExpertPanel";
import MarketForecast from "./MarketForecast";
import NeuralNewsFeed from "./NeuralNewsFeed";
import DossierCompiler from "./DossierCompiler";
import DossierModal from "./DossierModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DuelEngineProps {
  userCredits: number;
  onSpendCredit: () => void;
}

const DuelEngine = ({ userCredits, onSpendCredit }: DuelEngineProps) => {
  const [activeCategory, setActiveCategory] = useState<ComparisonCategory>("tech");
  
  const [customInputA, setCustomInputA] = useState("");
  const [customInputB, setCustomInputB] = useState("");
  
  const [itemA, setItemA] = useState<ComparisonItem>(mockDB[0]);
  const [itemB, setItemB] = useState<ComparisonItem>(mockDB[1]);

  const [isSearching, setIsSearching] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  
  const initialWeights = useMemo(() => {
    const keys = Object.keys(itemA.metrics);
    return keys.reduce((acc, key) => ({ ...acc, [key]: 5 }), {});
  }, [itemA]);

  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);

  useEffect(() => {
    const defaults = mockDB.filter(i => i.category === activeCategory);
    if (defaults.length >= 2) {
      setItemA(defaults[0]);
      setItemB(defaults[1]);
      setCustomInputA("");
      setCustomInputB("");
    }
    setShowResult(false);
  }, [activeCategory]);

  const startDuel = () => {
    if (userCredits <= 0) {
      toast.error("Insufficient Neural Credits. Please upgrade.");
      return;
    }

    let finalA = itemA;
    let finalB = itemB;

    if (customInputA) {
      finalA = generateSyntheticItem(customInputA, activeCategory);
    }
    if (customInputB) {
      finalB = generateSyntheticItem(customInputB, activeCategory);
    }

    setItemA(finalA);
    setItemB(finalB);
    
    const keys = Object.keys(finalA.metrics);
    setWeights(keys.reduce((acc, key) => ({ ...acc, [key]: 5 }), {}));

    onSpendCredit();
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Neural Link Copied", {
      description: "Secure protocol link ready for transmission."
    });
  };

  const scoreA = Object.values(itemA.metrics).reduce((a, b) => a + b, 0);
  const scoreB = Object.values(itemB.metrics).reduce((a, b) => a + b, 0);
  const winner = scoreA > scoreB ? itemA : itemB;
  const loser = scoreA > scoreB ? itemB : itemA;
  const matchPercentage = 85 + Math.floor(Math.random() * 14);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <LiveActivityTicker />
      </div>
      
      {isSearching && <LoadingScreen onComplete={handleDuelComplete} />}
      {isCompiling && <DossierCompiler onComplete={() => { setIsCompiling(false); setShowDossier(true); }} />}
      <DossierModal 
        open={showDossier} 
        onOpenChange={setShowDossier}
        winner={winner}
        loser={loser}
        matchPercentage={matchPercentage}
      />
      
      <DuelHistory history={history} onClear={() => setHistory([])} />

      {/* Category Nav */}
      <div className="flex justify-center flex-wrap gap-2 mb-12">
        {["tech", "gaming", "ai-tools", "dev-tools", "groceries", "travel", "sports", "living"].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as ComparisonCategory)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeCategory === cat 
                ? "bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/20" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Input Section */}
      {!showResult && !isSearching && (
        <div className="max-w-3xl mx-auto mb-16 relative z-10 animate-in fade-in zoom-in duration-500">
           <GlassCard className="p-8 border-purple-500/20 bg-purple-500/5">
             <div className="flex flex-col md:flex-row gap-4 items-center">
               <div className="flex-1 w-full">
                 <label className="text-[10px] font-black uppercase text-white/40 mb-2 block tracking-widest">Contender A</label>
                 <Input 
                  value={customInputA}
                  onChange={(e) => setCustomInputA(e.target.value)}
                  placeholder={itemA.name}
                  className="h-14 bg-black/40 border-white/10 rounded-xl pl-4 text-lg font-bold focus:ring-purple-500"
                 />
               </div>
               <div className="flex items-center justify-center pt-6">
                 <div className="bg-white/10 px-3 py-1.5 rounded-full font-black text-sm italic text-white/20">VS</div>
               </div>
               <div className="flex-1 w-full">
                 <label className="text-[10px] font-black uppercase text-white/40 mb-2 block tracking-widest">Contender B</label>
                 <Input 
                    value={customInputB}
                    onChange={(e) => setCustomInputB(e.target.value)}
                    placeholder={itemB.name}
                    className="h-14 bg-black/40 border-white/10 rounded-xl pl-4 text-lg font-bold focus:ring-emerald-500"
                   />
               </div>
             </div>
             
             <div className="mt-8 flex justify-center">
                {userCredits > 0 ? (
                  <Button 
                    onClick={startDuel}
                    className="rounded-full bg-gradient-to-r from-purple-600 to-emerald-500 hover:opacity-90 text-white px-12 py-8 text-2xl font-black uppercase italic tracking-tighter shadow-2xl shadow-purple-600/20 transition-all hover:scale-105"
                  >
                    <Zap className="w-6 h-6 mr-3 fill-white" />
                    COMPARE NOW
                    <span className="ml-2 text-xs opacity-50 font-medium normal-case not-italic tracking-normal bg-black/20 px-2 py-0.5 rounded-full">-1 Credit</span>
                  </Button>
                ) : (
                   <Button 
                    disabled
                    className="rounded-full bg-red-900/50 text-white/50 px-12 py-8 text-xl font-black uppercase italic tracking-tighter cursor-not-allowed border border-red-500/30"
                  >
                    <Lock className="w-6 h-6 mr-3" />
                    CREDIT LIMIT REACHED
                  </Button>
                )}
             </div>
             
             {userCredits === 0 && (
                <p className="text-center text-red-400 text-xs mt-4 font-bold uppercase tracking-widest">
                  <AlertTriangle className="w-3 h-3 inline mr-1" /> Plan upgrade required for further analysis
                </p>
             )}
           </GlassCard>
        </div>
      )}

      {showResult && (
        <div className="space-y-12 mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
            <AIVerdict itemA={itemA} itemB={itemB} weights={weights} />
            <div className="flex gap-2 pb-6">
              <Button onClick={() => setShowResult(false)} variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase h-10 px-6">
                <Search className="w-4 h-4 mr-2" /> New Search
              </Button>
              <Button onClick={() => setIsCompiling(true)} variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase h-10 px-6">
                <Download className="w-4 h-4 mr-2" /> Dossier
              </Button>
              <Button onClick={handleShare} variant="outline" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border-transparent text-[10px] font-black uppercase h-10 px-6">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mb-8">
             <PreferenceTuner 
              metrics={Object.keys(itemA.metrics)} 
              weights={weights} 
              onWeightChange={(m, v) => setWeights(prev => ({ ...prev, [m]: v }))}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
               <WinConditions itemA={itemA} itemB={itemB} />
               
               <GlassCard className="bg-gradient-to-r from-purple-600/10 to-emerald-600/10 border-purple-500/20">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h4 className="text-lg font-black italic uppercase tracking-tighter mb-1">Human Intuition Protocol</h4>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">How does your instinct compare to the Neural Engine?</p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => setUserVote('A')}
                        className={`rounded-2xl px-6 h-14 flex flex-col items-center justify-center transition-all ${
                          userVote === 'A' ? 'bg-purple-600 text-white scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase">Vote for</span>
                        <span className="text-sm font-black italic truncate max-w-[100px]">{itemA.name}</span>
                      </Button>
                      <Button 
                        onClick={() => setUserVote('B')}
                        className={`rounded-2xl px-6 h-14 flex flex-col items-center justify-center transition-all ${
                          userVote === 'B' ? 'bg-emerald-600 text-white scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase">Vote for</span>
                        <span className="text-sm font-black italic truncate max-w-[100px]">{itemB.name}</span>
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
    </div>
  );
};

export default DuelEngine;