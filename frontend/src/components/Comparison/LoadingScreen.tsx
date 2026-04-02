import React, { useState, useEffect } from "react";
import { Zap, Globe, Database, Cpu, Search } from "lucide-react";
import { brand } from "@/config/brand";

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(`Initializing ${brand.aiEngineName}...`);

  const logs = [
    "Scraping real-time sector indices...",
    "Analyzing cultural sentiment on social media...",
    "Fetching current global market liquidity...",
    "Calculating utility vs. efficiency curves...",
    "Processing AI weights for your region...",
    "Synthesizing the final AI Verdict...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    const logInterval = setInterval(() => {
      setStatus(logs[Math.floor(Math.random() * logs.length)]);
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-purple-600/5 blur-[120px] rounded-full animate-pulse" />

      <div className="relative mb-12">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-emerald-500 rounded-3xl flex items-center justify-center animate-bounce shadow-[0_0_50px_rgba(168,85,247,0.5)]">
          <Zap className="text-white w-12 h-12 fill-white" />
        </div>
        <div className="absolute -inset-4 border border-white/10 rounded-[2.5rem] animate-[spin_10s_linear_infinite]" />
      </div>

      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">
          Analyzing Duel...
        </h2>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-3 text-white/40 text-xs font-mono">
          <Cpu className="w-3 h-3 animate-spin text-emerald-400" />
          <span>{status}</span>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-3 gap-8 opacity-20">
        <div className="flex flex-col items-center gap-2">
          <Globe className="w-8 h-8 animate-pulse text-purple-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest">
            Global Scan
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Database className="w-8 h-8 animate-pulse [animation-delay:200ms] text-emerald-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest">
            Big Data
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Search className="w-8 h-8 animate-pulse [animation-delay:400ms] text-purple-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest">
            Sentiment
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
