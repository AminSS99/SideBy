import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../GlassCard";
import {
  Trophy,
  ArrowLeftRight,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Crown,
  Zap,
  Target,
  Shield,
  TrendingUp,
  Star,
  MessageCircle,
  Copy,
  ExternalLink,
  Award,
  Flame,
  ChevronDown,
  ChevronUp,
  Globe,
  Users,
  DollarSign,
  Heart,
  Building,
  Clock,
  GraduationCap,
  User,
  Wallet,
  Monitor,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAnimationConfig,
  isMobileDevice,
  prefersReducedMotion,
} from "@/utils/optimizations";
import {
  detectCategory,
  getRandomTip,
  CategoryConfig,
} from "@/config/categoryConfig";
import { buildShareUrl } from "@/config/brand";
import { ItemImage, PhotoGallery } from "./ItemImage";

interface ComparisonResultsProps {
  itemA: string;
  itemB: string;
  aiSummary: string | null;
  onSwap: () => void;
  onNewSearch: () => void;
}

// Particle background effect
const ParticleField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-purple-500/30"
        initial={{
          x: Math.random() * 100 + "%",
          y: Math.random() * 100 + "%",
          scale: 0,
        }}
        animate={{
          y: [null, "-20%"],
          scale: [0, 1, 0],
          opacity: [0, 0.6, 0],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
          ease: "easeOut",
        }}
      />
    ))}
  </div>
);

// Color scale
const getScoreStyle = (score: number) => {
  if (score >= 85)
    return {
      color: "text-blue-400",
      bg: "bg-blue-500",
      border: "border-blue-500/50",
      glow: "shadow-blue-500/40",
      label: "Excellent",
    };
  if (score >= 70)
    return {
      color: "text-emerald-400",
      bg: "bg-emerald-500",
      border: "border-emerald-500/50",
      glow: "shadow-emerald-500/40",
      label: "Great",
    };
  if (score >= 55)
    return {
      color: "text-yellow-400",
      bg: "bg-yellow-500",
      border: "border-yellow-500/50",
      glow: "shadow-yellow-500/40",
      label: "Good",
    };
  if (score >= 40)
    return {
      color: "text-orange-400",
      bg: "bg-orange-500",
      border: "border-orange-500/50",
      glow: "shadow-orange-500/40",
      label: "Fair",
    };
  return {
    color: "text-red-400",
    bg: "bg-red-500",
    border: "border-red-500/50",
    glow: "shadow-red-500/40",
    label: "Poor",
  };
};

// Animated score with glow
const AnimatedScore = ({
  value,
  delay = 0,
  size = "lg",
}: {
  value: number;
  delay?: number;
  size?: string;
}) => {
  const [count, setCount] = useState(0);
  const style = getScoreStyle(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += Math.ceil(value / 30);
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(current);
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const sizeClass =
    size === "xl" ? "text-4xl" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <motion.span
      className={`font-black ${sizeClass} ${style.color}`}
      animate={{
        textShadow: [
          `0 0 20px ${style.color}`,
          `0 0 40px ${style.color}`,
          `0 0 20px ${style.color}`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {count}
    </motion.span>
  );
};

// Glowing orb decoration
const GlowOrb = ({
  color,
  size,
  position,
}: {
  color: string;
  size: string;
  position: string;
}) => (
  <motion.div
    className={`absolute ${position} ${size} rounded-full ${color} blur-3xl opacity-30 pointer-events-none`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  />
);

// Parse AI summary into sections - extracts real data from AI response
const parseAISummary = (
  summary: string | null,
  itemA: string,
  itemB: string,
) => {
  const defaultResult = {
    category: "General",
    verdict: `Both ${itemA} and ${itemB} are excellent choices.`,
    winner: itemA,
    itemAStrengths: [
      "Strong foundation",
      "Proven track record",
      "Wide adoption",
    ],
    itemBStrengths: ["Modern approach", "Growing community", "Flexible design"],
    recommendation: `Choose ${itemA} for stability, choose ${itemB} for innovation.`,
    headToHead: [
      { aspect: "Popularity", scoreA: "High", scoreB: "Growing" },
      { aspect: "Ease of Use", scoreA: "Good", scoreB: "Great" },
      { aspect: "Performance", scoreA: "Excellent", scoreB: "Excellent" },
      { aspect: "Community", scoreA: "Large", scoreB: "Active" },
    ],
  };

  if (!summary) return defaultResult;

  try {
    const lines = summary.split("\n");

    // Extract category
    const categoryLine = lines.find((l) =>
      l.toLowerCase().includes("category:"),
    );
    const category =
      categoryLine
        ?.replace(/.*category:\s*/i, "")
        .replace(/[#*]/g, "")
        .trim() || "General";

    // Extract verdict and winner
    const verdictLine = lines.find(
      (l) => l.includes("Verdict") || l.includes("verdict"),
    );
    const verdictIdx = lines.findIndex(
      (l) => l.includes("Verdict") || l.includes("verdict"),
    );
    let verdict = "";
    if (verdictIdx !== -1 && lines[verdictIdx + 1]) {
      verdict = lines[verdictIdx + 1].replace(/[#*]/g, "").trim();
    }
    if (!verdict && verdictLine) {
      verdict = verdictLine
        .replace(/.*Verdict/i, "")
        .replace(/[#*🏆]/g, "")
        .trim();
    }

    // Determine winner from verdict
    let winner = itemA;
    if (
      verdict.toLowerCase().includes(itemB.toLowerCase()) &&
      (verdict.toLowerCase().includes("better") ||
        verdict.toLowerCase().includes("wins") ||
        verdict.toLowerCase().includes("winner"))
    ) {
      winner = itemB;
    } else if (
      verdict.toLowerCase().includes(itemA.toLowerCase()) &&
      (verdict.toLowerCase().includes("better") ||
        verdict.toLowerCase().includes("wins") ||
        verdict.toLowerCase().includes("winner"))
    ) {
      winner = itemA;
    }

    // Extract strengths for item A - try multiple formats
    const itemAPatterns = [
      `## ${itemA}`,
      `**${itemA}**`,
      `${itemA} Strengths`,
      `${itemA}:`,
      `### ${itemA}`,
    ];
    let itemAIdx = lines.findIndex((l) =>
      itemAPatterns.some((p) => l.toLowerCase().includes(p.toLowerCase())),
    );
    const itemAStrengths: string[] = [];

    if (itemAIdx !== -1) {
      for (
        let i = itemAIdx + 1;
        i < Math.min(itemAIdx + 12, lines.length);
        i++
      ) {
        const line = lines[i].trim();
        // Stop if we hit another section
        if (
          line.toLowerCase().includes(itemB.toLowerCase()) &&
          (line.includes("##") || line.includes("**"))
        )
          break;
        if (
          line.toLowerCase().includes("recommendation") ||
          line.toLowerCase().includes("verdict")
        )
          break;

        // Match various formats: bullets, numbered, "Strength X:"
        if (
          line.startsWith("-") ||
          line.startsWith("•") ||
          line.startsWith("*") ||
          line.match(/^(\d+\.|Strength \d)/i)
        ) {
          const strength = line
            .replace(/^[-•*]\s*/, "")
            .replace(/^\d+\.\s*/, "")
            .replace(/^Strength \d+:\s*/i, "")
            .replace(/\*\*/g, "")
            .trim();
          if (
            strength &&
            strength.length > 5 &&
            !strength.toLowerCase().includes("best for")
          ) {
            itemAStrengths.push(strength.substring(0, 150));
          }
        }
      }
    }

    // Extract strengths for item B - try multiple formats
    const itemBPatterns = [
      `## ${itemB}`,
      `**${itemB}**`,
      `${itemB} Strengths`,
      `${itemB}:`,
      `### ${itemB}`,
    ];
    let itemBIdx = lines.findIndex((l) =>
      itemBPatterns.some((p) => l.toLowerCase().includes(p.toLowerCase())),
    );
    const itemBStrengths: string[] = [];
    if (itemBIdx !== -1) {
      for (
        let i = itemBIdx + 1;
        i < Math.min(itemBIdx + 12, lines.length);
        i++
      ) {
        const line = lines[i].trim();
        // Stop if we hit recommendation section
        if (
          line.toLowerCase().includes("recommendation") ||
          line.toLowerCase().includes("verdict")
        )
          break;

        // Match various formats: bullets, numbered, "Strength X:"
        if (
          line.startsWith("-") ||
          line.startsWith("•") ||
          line.startsWith("*") ||
          line.match(/^(\d+\.|Strength \d)/i)
        ) {
          const strength = line
            .replace(/^[-•*]\s*/, "")
            .replace(/^\d+\.\s*/, "")
            .replace(/^Strength \d+:\s*/i, "")
            .replace(/\*\*/g, "")
            .trim();
          if (
            strength &&
            strength.length > 5 &&
            !strength.toLowerCase().includes("best for")
          ) {
            itemBStrengths.push(strength.substring(0, 150));
          }
        }
      }
    }

    // Extract recommendation
    const recIdx = lines.findIndex(
      (l) => l.includes("Recommendation") || l.includes("Final"),
    );
    let recommendation = "";
    if (recIdx !== -1) {
      for (let i = recIdx + 1; i < Math.min(recIdx + 3, lines.length); i++) {
        const line = lines[i].replace(/[#*💡]/g, "").trim();
        if (line && line.length > 10) {
          recommendation = line;
          break;
        }
      }
    }

    // Extract head-to-head table
    const tableLines = lines.filter(
      (l) => l.includes("|") && !l.includes("---"),
    );
    const headToHead = tableLines.slice(1, 5).map((line) => {
      const cells = line.split("|").filter((c) => c.trim());
      return {
        aspect: cells[0]?.trim().replace(/\*\*/g, "") || "Factor",
        scoreA: cells[1]?.trim() || "Good",
        scoreB: cells[2]?.trim() || "Good",
      };
    });

    return {
      category: category || "General",
      verdict: verdict || defaultResult.verdict,
      winner,
      itemAStrengths:
        itemAStrengths.length > 0
          ? itemAStrengths
          : defaultResult.itemAStrengths,
      itemBStrengths:
        itemBStrengths.length > 0
          ? itemBStrengths
          : defaultResult.itemBStrengths,
      recommendation: recommendation || defaultResult.recommendation,
      headToHead: headToHead.length > 0 ? headToHead : defaultResult.headToHead,
    };
  } catch (e) {
    console.error("Error parsing AI summary:", e);
    return defaultResult;
  }
};

// Popular comparisons
const popularComparisons = [
  { a: "Paris", b: "London", emoji: "🌍" },
  { a: "iPhone 16", b: "Galaxy S25", emoji: "📱" },
  { a: "PS5", b: "Xbox", emoji: "🎮" },
  { a: "React", b: "Vue", emoji: "⚛️" },
  { a: "Tesla", b: "BMW", emoji: "🚗" },
];

const ComparisonResults: React.FC<ComparisonResultsProps> = ({
  itemA,
  itemB,
  aiSummary,
  onSwap,
  onNewSearch,
}) => {
  const [copied, setCopied] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "breakdown",
  );

  // Mobile optimization - detect device and get animation config
  const [isMobile, setIsMobile] = useState(false);
  const animConfig = useMemo(() => getAnimationConfig(), []);

  useEffect(() => {
    setIsMobile(isMobileDevice());

    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Parse AI response with actual item names
  const parsedAI = useMemo(
    () => parseAISummary(aiSummary, itemA, itemB),
    [aiSummary, itemA, itemB],
  );

  // Winner from parsed AI
  const winner = parsedAI.winner;
  const winnerIsA = winner === itemA;

  // Detect category based on items
  const detectedCategory = useMemo(
    () => detectCategory(itemA, itemB),
    [itemA, itemB],
  );

  // Dynamic tip based on category
  const categoryTip = useMemo(
    () => getRandomTip(detectedCategory),
    [detectedCategory],
  );

  // Icon mapping for dynamic categories
  const iconMap: Record<string, any> = {
    Trophy,
    Award,
    DollarSign,
    Users,
    TrendingUp,
    Globe,
    Shield,
    Star,
    Flame,
    Heart,
    Zap,
    Building,
    Clock,
    GraduationCap,
    User,
    Wallet,
    Monitor,
    Gauge,
    Target,
  };

  // Get first 5 metrics from detected category with dynamic icons
  const categories = useMemo(() => {
    const metrics = detectedCategory.metrics.slice(0, 5);
    // Generate mock scores based on item names (in real app, these would come from AI)
    const seedA = itemA.length;
    const seedB = itemB.length;
    return metrics.map((metric, i) => ({
      name: metric.label
        .replace(/_/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      icon: iconMap[metric.icon] || Flame,
      scoreA: Math.min(95, Math.max(65, 75 + ((seedA * (i + 1)) % 20))),
      scoreB: Math.min(95, Math.max(65, 70 + ((seedB * (i + 2)) % 25))),
    }));
  }, [detectedCategory, itemA, itemB]);

  const handleShare = () => {
    navigator.clipboard.writeText(
      buildShareUrl(`compare/${itemA}-vs-${itemB}`),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 relative">
      {/* Background Effects - Disabled on mobile for performance */}
      {!isMobile && animConfig.enableParticles && <ParticleField />}
      <GlowOrb
        color="bg-purple-600"
        size="w-96 h-96"
        position="-top-48 -left-48"
      />
      <GlowOrb
        color="bg-emerald-600"
        size="w-80 h-80"
        position="-bottom-40 -right-40"
      />

      {/* === EPIC WINNER ANNOUNCEMENT === */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="text-center mb-8 relative z-10"
      >
        <motion.div
          className="inline-block"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-2xl blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border border-yellow-500/30 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                >
                  <Crown className="w-8 h-8 text-yellow-400" />
                </motion.div>
                <div className="text-left">
                  <div className="text-xs text-yellow-300/70 font-bold uppercase tracking-wider">
                    Champion
                  </div>
                  <div className="text-2xl font-black text-white">{winner}</div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-3xl font-black text-emerald-400">
                    92%
                  </div>
                  <div className="text-[10px] text-white/50 uppercase">
                    Match Score
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* === BATTLE ARENA === */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-[1fr,100px,1fr] gap-4 mb-8 relative z-10"
      >
        {/* ITEM A */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          whileHover={{ scale: 1.02 }}
          className="relative group"
        >
          <motion.div
            className={`absolute inset-0 rounded-3xl blur-2xl transition-all ${winnerIsA ? "bg-purple-600/40" : "bg-purple-600/20"}`}
            animate={
              winnerIsA ? { scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] } : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          <GlassCard
            className={`relative p-6 rounded-3xl border-2 transition-all ${winnerIsA ? "border-purple-400/60" : "border-white/10"}`}
          >
            {winnerIsA && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
              >
                <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-black uppercase shadow-lg shadow-yellow-500/30">
                  <Crown className="w-3 h-3 inline mr-1" /> Winner
                </div>
              </motion.div>
            )}

            <div className="text-center">
              <motion.div
                className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 shadow-2xl shadow-purple-500/30 relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <ItemImage
                  itemName={itemA}
                  category={detectedCategory.id}
                  size="lg"
                  className="w-full h-full"
                />
              </motion.div>

              <h3 className="text-2xl font-black tracking-tight mb-1">
                {itemA}
              </h3>

              {/* Quick Score Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {categories.slice(0, 2).map((cat, i) => {
                  const style = getScoreStyle(cat.scoreA);
                  return (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className={`p-3 rounded-xl bg-white/5 border ${style.border}`}
                    >
                      <cat.icon
                        className={`w-4 h-4 mx-auto mb-1 ${style.color}`}
                      />
                      <AnimatedScore
                        value={cat.scoreA}
                        delay={600 + i * 100}
                        size="lg"
                      />
                      <div className="text-[9px] text-white/40 uppercase mt-1">
                        {cat.name}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* VS COLUMN */}
        <div className="flex flex-col items-center justify-center gap-4 relative">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="relative z-10"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(168,85,247,0.3)",
                  "0 0 40px rgba(168,85,247,0.5)",
                  "0 0 20px rgba(168,85,247,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-emerald-600 flex items-center justify-center"
            >
              <Zap className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>

          <motion.button
            onClick={onSwap}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm relative z-10"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* ITEM B */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          whileHover={{ scale: 1.02 }}
          className="relative group"
        >
          <motion.div
            className={`absolute inset-0 rounded-3xl blur-2xl transition-all ${!winnerIsA ? "bg-emerald-600/40" : "bg-emerald-600/20"}`}
            animate={
              !winnerIsA
                ? { scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          <GlassCard
            className={`relative p-6 rounded-3xl border-2 transition-all ${!winnerIsA ? "border-emerald-400/60" : "border-white/10"}`}
          >
            {!winnerIsA && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
              >
                <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-black uppercase shadow-lg shadow-yellow-500/30">
                  <Crown className="w-3 h-3 inline mr-1" /> Winner
                </div>
              </motion.div>
            )}

            <div className="text-center">
              <motion.div
                className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 shadow-2xl shadow-emerald-500/30 relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <ItemImage
                  itemName={itemB}
                  category={detectedCategory.id}
                  size="lg"
                  className="w-full h-full"
                />
              </motion.div>

              <h3 className="text-2xl font-black tracking-tight mb-1">
                {itemB}
              </h3>

              {/* Quick Score Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {categories.slice(0, 2).map((cat, i) => {
                  const style = getScoreStyle(cat.scoreB);
                  return (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className={`p-3 rounded-xl bg-white/5 border ${style.border}`}
                    >
                      <cat.icon
                        className={`w-4 h-4 mx-auto mb-1 ${style.color}`}
                      />
                      <AnimatedScore
                        value={cat.scoreB}
                        delay={600 + i * 100}
                        size="lg"
                      />
                      <div className="text-[9px] text-white/40 uppercase mt-1">
                        {cat.name}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* === FULL BREAKDOWN === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6 relative z-10"
      >
        <GlassCard className="p-6 rounded-3xl overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === "breakdown" ? null : "breakdown",
              )
            }
            className="w-full flex items-center justify-between mb-4"
          >
            <h4 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Full Category Breakdown
            </h4>
            {expandedSection === "breakdown" ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === "breakdown" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {categories.map((cat, i) => {
                  const aWins = cat.scoreA > cat.scoreB;
                  const styleA = getScoreStyle(cat.scoreA);
                  const styleB = getScoreStyle(cat.scoreB);

                  return (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative group"
                    >
                      <div className="flex items-center gap-4">
                        {/* A Side */}
                        <div className="w-14 text-right">
                          <AnimatedScore value={cat.scoreA} delay={i * 80} />
                        </div>
                        <div className="flex-1 h-12 rounded-xl bg-white/5 overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.scoreA}%` }}
                            transition={{
                              delay: 0.3 + i * 0.08,
                              duration: 0.8,
                              ease: "easeOut",
                            }}
                            className={`absolute right-0 h-full ${styleA.bg} ${aWins ? "shadow-lg " + styleA.glow : "opacity-60"}`}
                          >
                            {aWins && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1 + i * 0.08 }}
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                              >
                                <Check className="w-5 h-5 text-white drop-shadow-lg" />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>

                        {/* Center Label */}
                        <div className="w-24 text-center">
                          <cat.icon className="w-5 h-5 mx-auto mb-1 text-white/60" />
                          <span className="text-xs font-bold text-white/60">
                            {cat.name}
                          </span>
                        </div>

                        {/* B Side */}
                        <div className="flex-1 h-12 rounded-xl bg-white/5 overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.scoreB}%` }}
                            transition={{
                              delay: 0.3 + i * 0.08,
                              duration: 0.8,
                              ease: "easeOut",
                            }}
                            className={`absolute left-0 h-full ${styleB.bg} ${!aWins ? "shadow-lg " + styleB.glow : "opacity-60"}`}
                          >
                            {!aWins && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1 + i * 0.08 }}
                                className="absolute left-2 top-1/2 -translate-y-1/2"
                              >
                                <Check className="w-5 h-5 text-white drop-shadow-lg" />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                        <div className="w-14">
                          <AnimatedScore value={cat.scoreB} delay={i * 80} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Legend */}
                <div className="flex justify-center gap-4 pt-4 text-[10px]">
                  {["Excellent", "Great", "Good", "Fair", "Poor"].map(
                    (label, i) => {
                      const colors = [
                        "bg-blue-500",
                        "bg-emerald-500",
                        "bg-yellow-500",
                        "bg-orange-500",
                        "bg-red-500",
                      ];
                      return (
                        <span key={label} className="flex items-center gap-1.5">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${colors[i]}`}
                          />
                          {label}
                        </span>
                      );
                    },
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* === AI INSIGHT CARDS === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10"
      >
        {/* Best For */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }}>
          <GlassCard className="p-5 rounded-2xl h-full bg-gradient-to-br from-purple-600/10 to-transparent border-purple-500/20 hover:border-purple-400/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Target className="w-6 h-6 text-purple-400" />
              </motion.div>
              <div>
                <span className="text-xs font-black uppercase text-purple-300">
                  Best For
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-purple-400 font-bold">{itemA}:</span>{" "}
                <span className="text-white/70">
                  {detectedCategory.bestForLabels.itemA}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-emerald-400 font-bold">{itemB}:</span>{" "}
                <span className="text-white/70">
                  {detectedCategory.bestForLabels.itemB}
                </span>
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Trending */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }}>
          <GlassCard className="p-5 rounded-2xl h-full bg-gradient-to-br from-emerald-600/10 to-transparent border-emerald-500/20 hover:border-emerald-400/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </motion.div>
              <div>
                <span className="text-xs font-black uppercase text-emerald-300">
                  Trending
                </span>
              </div>
            </div>
            <p className="text-sm text-white/80">
              <span className="text-emerald-400 font-bold">{winner}</span> leads
              overall by{" "}
              <motion.span
                className="text-2xl font-black text-emerald-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                +6
              </motion.span>{" "}
              points
            </p>
          </GlassCard>
        </motion.div>

        {/* Pro Tip */}
        <motion.div whileHover={{ scale: 1.02, y: -5 }}>
          <GlassCard className="p-5 rounded-2xl h-full bg-gradient-to-br from-yellow-600/10 to-transparent border-yellow-500/20 hover:border-yellow-400/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </motion.div>
              <div>
                <span className="text-xs font-black uppercase text-yellow-300">
                  Pro Tip
                </span>
              </div>
            </div>
            <p className="text-sm text-white/80">{categoryTip}</p>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* === AI DEEP ANALYSIS === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mb-6 relative z-10"
      >
        <GlassCard className="p-6 rounded-3xl overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === "analysis" ? null : "analysis",
              )
            }
            className="w-full flex items-center justify-between mb-4"
          >
            <h4 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              AI Deep Analysis
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
                Detailed
              </span>
            </h4>
            {expandedSection === "analysis" ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === "analysis" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-6"
              >
                {/* Verdict Section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-purple-600/10 to-emerald-600/10 border border-purple-500/20"
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center flex-shrink-0"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Trophy className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <div className="text-xs font-black uppercase text-purple-300 mb-1">
                        🏆 Quick Verdict
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">
                        {parsedAI.verdict || (
                          <>
                            <span className="text-white font-bold">
                              {winner}
                            </span>{" "}
                            is the better choice for most users.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Side-by-Side Strengths */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item A Strengths */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-2xl bg-purple-600/10 border border-purple-500/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-lg font-black">
                        {itemA.charAt(0)}
                      </div>
                      <span className="font-bold text-purple-300">
                        {itemA} Strengths
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {parsedAI.itemAStrengths.map((strength, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-purple-400" />
                          </div>
                          <span className="text-white/80">{strength}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Item B Strengths */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-lg font-black">
                        {itemB.charAt(0)}
                      </div>
                      <span className="font-bold text-emerald-300">
                        {itemB} Strengths
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {parsedAI.itemBStrengths.map((strength, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                          <span className="text-white/80">{strength}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Key Insights Grid - Dynamic based on category */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  {(detectedCategory.id === "travel"
                    ? [
                        {
                          icon: Shield,
                          label: "Safety",
                          valueA: "Check local",
                          valueB: "advisories",
                        },
                        {
                          icon: TrendingUp,
                          label: "Weather",
                          valueA: "Research",
                          valueB: "seasons",
                        },
                        {
                          icon: Award,
                          label: "Cost",
                          valueA: "Compare",
                          valueB: "budgets",
                        },
                        {
                          icon: Users,
                          label: "Food",
                          valueA: "Local",
                          valueB: "cuisine",
                        },
                      ]
                    : detectedCategory.id === "sports"
                      ? [
                          {
                            icon: Award,
                            label: "Trophies",
                            valueA: "Check",
                            valueB: "history",
                          },
                          {
                            icon: Users,
                            label: "Fan Base",
                            valueA: "Global",
                            valueB: "support",
                          },
                          {
                            icon: TrendingUp,
                            label: "Form",
                            valueA: "Recent",
                            valueB: "results",
                          },
                          {
                            icon: Shield,
                            label: "Stadium",
                            valueA: "Home",
                            valueB: "advantage",
                          },
                        ]
                      : detectedCategory.id === "food"
                        ? [
                            {
                              icon: Award,
                              label: "Taste",
                              valueA: "Flavor",
                              valueB: "Profile",
                            },
                            {
                              icon: TrendingUp,
                              label: "Price",
                              valueA: "Value",
                              valueB: "Check",
                            },
                            {
                              icon: Users,
                              label: "Portion",
                              valueA: "Size",
                              valueB: "Matters",
                            },
                            {
                              icon: Shield,
                              label: "Wait",
                              valueA: "Time",
                              valueB: "Factor",
                            },
                          ]
                        : [
                            {
                              icon: Users,
                              label: "Community",
                              valueA: "Massive",
                              valueB: "Growing",
                            },
                            {
                              icon: TrendingUp,
                              label: "Momentum",
                              valueA: "Stable",
                              valueB: "Rising",
                            },
                            {
                              icon: Award,
                              label: "Learning",
                              valueA: "Steeper",
                              valueB: "Easier",
                            },
                            {
                              icon: Shield,
                              label: "Stability",
                              valueA: "Battle-tested",
                              valueB: "Mature",
                            },
                          ]
                  ).map((insight, i) => (
                    <motion.div
                      key={insight.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-center"
                    >
                      <insight.icon className="w-4 h-4 mx-auto mb-2 text-white/40" />
                      <div className="text-[10px] font-bold text-white/40 uppercase mb-1">
                        {insight.label}
                      </div>
                      <div className="text-[10px]">
                        <span className="text-purple-400">
                          {insight.valueA}
                        </span>
                        <span className="text-white/30 mx-1">vs</span>
                        <span className="text-emerald-400">
                          {insight.valueB}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Final Recommendation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/20"
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                    <div>
                      <div className="text-xs font-black uppercase text-yellow-300 mb-1">
                        💡 Final Recommendation
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {parsedAI.recommendation || (
                          <>
                            Choose{" "}
                            <span className="text-purple-400 font-bold">
                              {itemA}
                            </span>{" "}
                            for larger projects. Choose{" "}
                            <span className="text-emerald-400 font-bold">
                              {itemB}
                            </span>{" "}
                            for rapid development.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* === ACTION BUTTONS === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap justify-center gap-3 mb-8 relative z-10"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onNewSearch}
            variant="outline"
            className="rounded-full px-6 h-12 bg-white/5 border-white/20 hover:bg-white/10 font-bold"
          >
            <Zap className="w-4 h-4 mr-2" />
            New Comparison
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleShare}
            className="rounded-full px-6 h-12 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 font-bold shadow-lg shadow-purple-500/25"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Share2 className="w-4 h-4 mr-2" />
            )}
            {copied ? "Link Copied!" : "Share Results"}
          </Button>
        </motion.div>
      </motion.div>

      {/* === POPULAR COMPARISONS === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-white/40">
            🔥 Try These Next
          </h4>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCarouselIndex(Math.min(2, carouselIndex + 1))}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: -carouselIndex * 200 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {popularComparisons.map((comp, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                className="min-w-[180px] cursor-pointer"
              >
                <GlassCard className="p-4 rounded-xl hover:border-purple-500/40 transition-all group">
                  <div className="text-2xl mb-2">{comp.emoji}</div>
                  <div className="font-bold text-sm group-hover:text-purple-300 transition-colors">
                    {comp.a} <span className="text-white/30">vs</span> {comp.b}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* === PHOTO GALLERY === */}
      <PhotoGallery
        itemA={itemA}
        itemB={itemB}
        category={detectedCategory.id}
      />
    </div>
  );
};

export default ComparisonResults;
