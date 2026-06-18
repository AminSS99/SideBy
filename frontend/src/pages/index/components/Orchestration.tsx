import React from "react";
import { Network, Cpu, BookOpenText } from "lucide-react";

export const Orchestration = () => {
  return (
    <section className="orchestration-section mt-32 border-t border-[#2a2a2a] pt-24 pb-12">
      <div className="orchestration-heading text-center mb-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 mb-4 flex justify-center items-center gap-2">
          <Network className="h-3.5 w-3.5" /> Multi-Model Orchestration
        </p>
        <h2 className="font-serif text-4xl text-[#fdfbf7] md:text-5xl tracking-tight">The Right Engine for the Task</h2>
        <p className="mt-6 max-w-2xl mx-auto text-white/50 leading-relaxed">
          SideBy routes research across Gemini 3.1 Pro and DeepSeek V4 Pro so each step gets the right mix of reasoning, extraction, and synthesis.
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        <div className="orch-path absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent -translate-y-1/2 z-0 hidden md:block" />

        <div className="grid gap-6 md:grid-cols-3 relative z-10">
          <div className="orch-card border border-[#2a2a2a] bg-[#111] p-8 rounded-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-500/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            <Cpu className="h-8 w-8 text-blue-400 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-white mb-2">DeepSeek V4 Pro</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Logic & Extraction</p>
            <p className="text-sm text-white/50">Used for fast, highly accurate logic, extraction, and source normalization from raw web evidence.</p>
          </div>

          <div className="orch-card border border-orange-500/30 bg-[#1a110a] shadow-2xl p-8 rounded-sm text-center transform md:scale-110 z-20">
            <div className="absolute top-0 inset-x-0 h-1 bg-orange-500" />
            <img src="/sideby.ico" alt="SideBy Router" className="h-12 w-12 object-contain rounded-sm mx-auto mb-4" />
            <h3 className="font-serif text-xl text-white mb-2">SideBy Router</h3>
            <p className="text-xs text-orange-400 uppercase tracking-widest font-bold mb-3">Orchestration</p>
            <p className="text-sm text-white/60">Evaluates the query and intelligently splits tasks across providers.</p>
          </div>

          <div className="orch-card border border-[#2a2a2a] bg-[#111] p-8 rounded-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-purple-500/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            <BookOpenText className="h-8 w-8 text-purple-400 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-white mb-2">Gemini 3.1 Pro</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Synthesis & Prose</p>
            <p className="text-sm text-white/50">Used for deep synthesis, tradeoff analysis, and final executive verdicts.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
