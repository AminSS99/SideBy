import React, { useState } from "react";
import DuelEngine from "@/components/Comparison/DuelEngine";
import Leaderboard from "@/components/Comparison/Leaderboard";
import SystemStatus from "@/components/Comparison/SystemStatus";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Zap, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [credits, setCredits] = useState(5);

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(168,85,247,0.15),transparent)]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">SideBy</span>
          </div>
          
          <div className="flex items-center gap-4">
            <SystemStatus credits={credits} />
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 text-white/70">
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button className="rounded-full bg-white text-black hover:bg-white/90 px-6 font-bold text-xs shadow-xl">
              CONNECT
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-10 text-center relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-purple-600/5 blur-[120px] rounded-full z-0" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6 animate-bounce">
            <Zap className="w-3 h-3 fill-emerald-400" /> Neural Sync Protocol Active
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 italic uppercase leading-[0.9]">
            Compare <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-emerald-400 to-emerald-500">Everything.</span>
          </h1>
          <p className="max-w-xl mx-auto text-xs text-white/40 px-4 uppercase tracking-[0.2em] font-bold mt-4 leading-relaxed">
            Groceries. Games. Tools. Life decisions. <br/>
            The World's First Universal Neural Comparator.
          </p>
        </div>
      </header>

      {/* Main Duel Engine */}
      <main className="relative z-10">
        <DuelEngine userCredits={credits} onSpendCredit={() => setCredits(c => Math.max(0, c - 1))} />
        
        {/* Global Trends Section */}
        <div className="py-24 border-t border-white/5 relative bg-white/[0.01]">
          <Leaderboard />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-white/20 text-[10px] uppercase tracking-widest font-bold bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left opacity-40">
            <div className="space-y-4">
              <p className="text-white/60">Platform</p>
              <p>Neural Engine</p>
              <p>API Access</p>
              <p>Global Nodes</p>
            </div>
            <div className="space-y-4">
              <p className="text-white/60">Network</p>
              <p>Sentiment Data</p>
              <p>Market Pricing</p>
              <p>Social Pulse</p>
            </div>
            <div className="space-y-4 hidden md:block">
              <p className="text-white/60">Company</p>
              <p>About SideBy</p>
              <p>Ethical AI</p>
              <p>Whitepaper</p>
            </div>
            <div className="space-y-4 hidden md:block">
              <p className="text-white/60">Security</p>
              <p>Data Privacy</p>
              <p>Neural Shield</p>
              <p>Audit Logs</p>
            </div>
          </div>
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