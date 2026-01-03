import React, { useState } from "react";
import { motion } from "framer-motion";
import DuelEngine from "@/components/Comparison/DuelEngine";
import Leaderboard from "@/components/Comparison/Leaderboard";
import SystemStatus from "@/components/Comparison/SystemStatus";
import { Zap, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      className="min-h-screen bg-[#020202] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(168,85,247,0.15),transparent)]" />
      </div>

      {/* Navbar */}
      <motion.nav
        className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/sideby-logo.jpg" 
              alt="SideBy" 
              className="w-10 h-10 rounded-xl shadow-lg shadow-purple-600/20"
            />
            <span className="text-2xl font-black tracking-tighter">SideBy</span>
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
      </motion.nav>

      {/* Hero Section */}
      <motion.header 
        className="pt-48 pb-10 text-center relative z-10"
        variants={itemVariants}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-purple-600/5 blur-[120px] rounded-full z-0" />
        <div className="relative z-10">
          <motion.div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Zap className="w-3 h-3 fill-emerald-400" /> AI-Powered Search & Scraping
          </motion.div>
          <motion.h1 
            className="text-6xl md:text-8xl font-black tracking-tighter mb-4 italic uppercase leading-[0.9]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          >
            Compare <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-emerald-400 to-emerald-500">Anything.</span>
          </motion.h1>
          <motion.p 
            className="max-w-2xl mx-auto text-sm text-white/60 px-4 uppercase tracking-[0.1em] font-medium mt-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Harnessing the power of AI to summarize insights from <span className="text-white font-bold">Trustpilot</span>, <span className="text-white font-bold">TripAdvisor</span>, and across the web. 
            Get the truth behind every service, city, or product in seconds.
          </motion.p>
        </div>
      </motion.header>

      {/* Main Duel Engine */}
      <motion.main className="relative z-10" variants={itemVariants}>
        <DuelEngine userCredits={credits} onSpendCredit={() => setCredits(c => Math.max(0, c - 1))} />
        
        {/* Global Trends Section */}
        <div className="py-24 border-t border-white/5 relative bg-white/[0.01]">
          <Leaderboard />
        </div>
      </motion.main>

      {/* Footer */}
      <motion.footer 
        className="border-t border-white/5 py-12 text-center text-white/20 text-[10px] uppercase tracking-widest font-bold bg-black"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left opacity-60">
            <div className="space-y-3">
              <p className="text-white/80">Product</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">How it Works</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">Pricing</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">API Access</p>
            </div>
            <div className="space-y-3">
              <p className="text-white/80">Features</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">AI Comparison</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">Smart Categories</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">Share Results</p>
            </div>
            <div className="space-y-3 hidden md:block">
              <p className="text-white/80">Company</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">About Us</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">Blog</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">Contact</p>
            </div>
            <div className="space-y-3 hidden md:block">
              <p className="text-white/80">Legal</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">Privacy Policy</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">Terms of Service</p>
              <p className="hover:text-white/60 cursor-pointer transition-colors">Cookie Policy</p>
            </div>
          </div>
          <p>© 2026 SideBy • Compare Anything, Decide Faster</p>
          <p className="mt-2 text-white/30 normal-case tracking-normal">Made by Amin Sobor</p>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default Index;