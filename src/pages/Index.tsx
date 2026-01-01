import React from "react";
import DuelEngine from "@/components/Comparison/DuelEngine";
import Leaderboard from "@/components/Comparison/Leaderboard";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Zap, LayoutGrid, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">SideBy</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 mr-4 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Globe className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Engine v2.4</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 text-white/70">
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button className="rounded-full bg-white text-black hover:bg-white/90 px-6 font-bold text-xs">
              LOG IN
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/5 blur-[120px] rounded-full z-0" />
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 italic uppercase">
            Side-By-Side <br/> <span className="text-blue-500">Everything.</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm text-white/40 px-4 uppercase tracking-widest font-bold">
            The World's Most Advanced AI Protocol for Multi-Domain Comparisons.
          </p>
        </div>
      </header>

      {/* Main Duel Engine */}
      <main className="relative z-10">
        <DuelEngine />
        
        {/* Global Trends Section */}
        <div className="py-24 border-t border-white/5">
          <Leaderboard />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-white/20 text-[10px] uppercase tracking-widest font-bold">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 SIDEBY PLATFORM • THE FUTURE OF DECISIONS</p>
          <div className="mt-8">
            <MadeWithDyad />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;