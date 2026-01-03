import React, { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "../GlassCard";
import { Zap, ArrowLeftRight } from "lucide-react";
import { ComparisonSkeleton, LoadingMessage } from "./ComparisonSkeleton";
import ComparisonResults from "./ComparisonResults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { sanitizeInput, validateComparisonInput } from "@/utils/optimizations";

interface DuelEngineProps {
  userCredits: number;
  onSpendCredit: () => void;
}

// Category options
const categories = [
  { id: "travel", label: "Travel", icon: "🌍" },
  { id: "tech", label: "Tech", icon: "💻" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "apps", label: "Apps", icon: "📱" },
  { id: "food", label: "Food", icon: "🍔" },
  { id: "auto", label: "Auto", icon: "🚗" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "other", label: "Other", icon: "✨" },
];

const DuelEngine = ({ userCredits, onSpendCredit }: DuelEngineProps) => {
  // Input state
  const [itemA, setItemA] = useState("");
  const [itemB, setItemB] = useState("");
  const [activeCategory, setActiveCategory] = useState("travel");
  
  // UI state
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  // Swap items
  const handleSwap = () => {
    const temp = itemA;
    setItemA(itemB);
    setItemB(temp);
    toast.success("Items swapped!");
  };

  // Start comparison
  const startComparison = async () => {
    // Sanitize inputs
    const cleanA = sanitizeInput(itemA);
    const cleanB = sanitizeInput(itemB);
    
    // Validate inputs
    const validation = validateComparisonInput(cleanA, cleanB);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid input");
      return;
    }
    
    if (userCredits <= 0) {
      toast.error("No credits remaining");
      return;
    }

    onSpendCredit();
    setIsSearching(true);
    setShowResult(false);
    setAiSummary(null);

    try {
      const response = await fetch(
        `http://localhost:8080/api/compare?itemA=${encodeURIComponent(cleanA)}&itemB=${encodeURIComponent(cleanB)}`
      );
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAiSummary(data.summary);
      setIsSearching(false);
      setShowResult(true);
      toast.success("Comparison Complete!", {
        description: `${cleanA} vs ${cleanB} analyzed`
      });
    } catch (error: any) {
      console.error("Failed to fetch:", error);
      setIsSearching(false);
      toast.error("Analysis failed", {
        description: error.message || "Please try again"
      });
    }
  };

  const handleSearchComplete = () => {
    setIsSearching(false);
    setShowResult(true);
  };

  const handleNewSearch = () => {
    setShowResult(false);
    setItemA("");
    setItemB("");
    setAiSummary(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Premium Loading Skeleton */}
      {isSearching && (
        <>
          <LoadingMessage message={`Analyzing ${itemA} vs ${itemB}...`} />
          <ComparisonSkeleton />
        </>
      )}

      {/* Results */}
      {showResult && (
        <ComparisonResults
          itemA={itemA}
          itemB={itemB}
          aiSummary={aiSummary}
          onSwap={handleSwap}
          onNewSearch={handleNewSearch}
        />
      )}

      {/* Input Form - Hide when showing results */}
      {!showResult && !isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Category Selector */}
          <div className="flex justify-center flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat.id
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Main Comparison Input */}
          <GlassCard className="max-w-3xl mx-auto p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black tracking-tight mb-2">
                What do you want to compare?
              </h2>
              <p className="text-white/50 text-sm">
                Enter any two items, products, cities, or services
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Item A Input */}
              <div className="flex-1 w-full">
                <Input
                  value={itemA}
                  onChange={(e) => setItemA(e.target.value)}
                  placeholder="e.g., Paris"
                  className="h-14 text-lg bg-white/5 border-white/10 text-center"
                />
              </div>

              {/* VS / Swap */}
              <div className="flex items-center gap-2">
                <span className="text-white/30 font-black text-xl">VS</span>
                <Button
                  onClick={handleSwap}
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-white/10"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Item B Input */}
              <div className="flex-1 w-full">
                <Input
                  value={itemB}
                  onChange={(e) => setItemB(e.target.value)}
                  placeholder="e.g., London"
                  className="h-14 text-lg bg-white/5 border-white/10 text-center"
                />
              </div>
            </div>

            {/* Compare Button */}
            <div className="mt-8 text-center">
              <Button
                onClick={startComparison}
                disabled={!itemA.trim() || !itemB.trim() || userCredits <= 0}
                className="h-14 px-12 text-lg font-black bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600 rounded-full"
              >
                <Zap className="w-5 h-5 mr-2" />
                COMPARE NOW
              </Button>
              
              {userCredits <= 0 && (
                <p className="mt-4 text-red-400 text-xs">
                  No credits remaining. Upgrade to continue.
                </p>
              )}
            </div>
          </GlassCard>

          {/* Quick Examples */}
          <div className="text-center">
            <p className="text-xs text-white/30 mb-3">Popular comparisons:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                ["Paris", "London"],
                ["iPhone 16", "Galaxy S25"],
                ["React", "Vue"],
                ["PS5", "Xbox"],
              ].map(([a, b]) => (
                <button
                  key={`${a}-${b}`}
                  onClick={() => { setItemA(a); setItemB(b); }}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/60 transition-all"
                >
                  {a} vs {b}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DuelEngine;