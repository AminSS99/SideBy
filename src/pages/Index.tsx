import React from "react";
import CityDuel from "@/components/Comparison/CityDuel";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Search, Map, Zap, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">SideBy</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
            <a href="#" className="hover:text-white transition-colors">Travel</a>
            <a href="#" className="hover:text-white transition-colors">Sports</a>
            <a href="#" className="hover:text-white transition-colors">Gaming</a>
            <a href="#" className="hover:text-white transition-colors">DevTools</a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 text-white/70">
              <Search className="w-5 h-5" />
            </Button>
            <Button className="rounded-full bg-white text-black hover:bg-white/90 px-6 font-bold text-xs">
              LOG IN
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full z-0" />
        <div className="relative z-10">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            METROPOLIS DUEL
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-white/60 px-4">
            The next generation of urban exploration. Compare global metropolises with high-fidelity real-time data and AI-driven insights.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button variant="outline" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 gap-2">
              <Map className="w-4 h-4" /> Global Ranking
            </Button>
            <div className="text-xs text-white/30 uppercase tracking-widest font-bold px-4 py-2 border border-white/5 rounded-full">
              Free Trial: 1 Search Remaining
            </div>
          </div>
        </div>
      </header>

      {/* Comparison Engine */}
      <main className="relative z-10 pb-40">
        <CityDuel />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-white/20 text-xs uppercase tracking-widest font-medium">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 SIDEBY PLATFORM • THE FUTURE OF DECISIONS</p>
          <div className="mt-8 flex justify-center">
            <MadeWithDyad />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;