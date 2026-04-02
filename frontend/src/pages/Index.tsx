import React, { useState } from "react";
import { motion } from "framer-motion";
import DuelEngine from "@/components/Comparison/DuelEngine";
import Leaderboard from "@/components/Comparison/Leaderboard";
import SystemStatus from "@/components/Comparison/SystemStatus";
import { brand } from "@/config/brand";
import { Zap, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const Index = () => {
  const [credits, setCredits] = useState(5);

  return (
    <motion.div
      className="min-h-screen overflow-x-hidden bg-[#020202] font-sans text-white selection:bg-purple-500/30"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(168,85,247,0.15),transparent)]" />
      </div>

      <motion.nav
        className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl"
        variants={itemVariants}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <a
            href={brand.url}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
            aria-label={brand.productName}
          >
            <img
              src="/sideby-logo.jpg"
              alt={brand.productName}
              className="h-10 w-10 rounded-xl shadow-lg shadow-purple-600/20"
            />
            <div>
              <span className="block text-2xl font-black tracking-tighter">
                {brand.productName}
              </span>
              <span className="block text-[10px] uppercase tracking-[0.35em] text-white/35">
                {brand.tagline}
              </span>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <SystemStatus credits={credits} />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white/70 hover:bg-white/5"
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
              asChild
              className="rounded-full bg-white px-6 text-xs font-bold text-black shadow-xl hover:bg-white/90"
            >
              <Link to="/auth/sign-in">CONNECT</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      <motion.header
        className="relative z-10 pt-48 pb-10 text-center"
        variants={itemVariants}
      >
        <div className="absolute top-0 left-1/2 z-0 h-[600px] w-full -translate-x-1/2 rounded-full bg-purple-600/5 blur-[120px]" />
        <div className="relative z-10">
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Zap className="h-3 w-3 fill-emerald-400" />
            Multi-source AI research
          </motion.div>
          <motion.h1
            className="mb-4 text-6xl font-black uppercase leading-[0.9] tracking-tighter md:text-8xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          >
            Compare.
            <br />
            Decide.
            <br />
            <span className="bg-gradient-to-r from-purple-500 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              Ship smarter.
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl px-4 text-sm font-medium uppercase leading-relaxed tracking-[0.1em] text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Harnessing the power of AI to summarize insights from{" "}
            <span className="font-bold text-white">Trustpilot</span>,{" "}
            <span className="font-bold text-white">TripAdvisor</span>, and the
            broader web.
            {` ${brand.productShortName} turns raw signals into sharper decisions for services, cities, products, and workflows.`}
          </motion.p>
        </div>
      </motion.header>

      <motion.main className="relative z-10" variants={itemVariants}>
        <DuelEngine
          userCredits={credits}
          onSpendCredit={() =>
            setCredits((current) => Math.max(0, current - 1))
          }
        />

        <div className="relative border-t border-white/5 bg-white/[0.01] py-24">
          <Leaderboard />
        </div>
      </motion.main>

      <motion.footer
        className="bg-black py-12 text-center text-[10px] font-bold uppercase tracking-widest text-white/20"
        variants={itemVariants}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 grid grid-cols-2 gap-8 text-left opacity-60 md:grid-cols-4">
            <div className="space-y-3">
              <p className="text-white/80">Product</p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                How it Works
              </p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                Pricing
              </p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                API Access
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-white/80">Features</p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                AI Comparison
              </p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                Smart Categories
              </p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                Share Results
              </p>
            </div>
            <div className="hidden space-y-3 md:block">
              <p className="text-white/80">Company</p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                About Us
              </p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                Blog
              </p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                Contact
              </p>
            </div>
            <div className="hidden space-y-3 md:block">
              <p className="text-white/80">Legal</p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                Privacy Policy
              </p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                Terms of Service
              </p>
              <p className="cursor-pointer transition-colors hover:text-white/60">
                Cookie Policy
              </p>
            </div>
          </div>
          <p>{`(c) 2026 ${brand.productName} - ${brand.tagline}`}</p>
          <a
            href={brand.url}
            className="mt-2 inline-block normal-case tracking-normal text-white/30 transition-colors hover:text-white/70"
          >
            {brand.operatedByLine}
          </a>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default Index;
