import React from "react";
import { Scale, Zap, ShieldCheck } from "lucide-react";

export const Features = () => {
  return (
    <div className="features-grid grid gap-6 md:grid-cols-3 pt-12 border-t border-[#2a2a2a]">
      <div className="feature-card border border-[#2a2a2a] bg-[#0c0b0a] p-8 rounded-sm hover:border-[#444] transition-colors">
        <div className="feature-icon mb-6 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-white">
          <Scale className="h-6 w-6" />
        </div>
        <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">Unbiased Verdicts</h3>
        <p className="text-sm text-white/50 leading-relaxed">
          We extract facts directly from official documentation, pricing pages, and GitHub repositories to give you the raw truth.
        </p>
      </div>
      <div className="feature-card border border-orange-500/30 bg-[#1a110a] shadow-[0_0_30px_rgba(234,88,12,0.05)] p-8 rounded-sm">
        <div className="feature-icon mb-6 inline-flex rounded-sm bg-orange-500/10 border border-orange-500/20 p-3 text-orange-400">
          <Zap className="h-6 w-6" />
        </div>
        <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">Instant Generation</h3>
        <p className="text-sm text-white/50 leading-relaxed">
          What used to take 3 days of reading docs and opening tabs now takes 30 seconds. Generate an entire matrix instantly.
        </p>
      </div>
      <div className="feature-card border border-[#2a2a2a] bg-[#0c0b0a] p-8 rounded-sm hover:border-[#444] transition-colors">
        <div className="feature-icon mb-6 inline-flex rounded-sm bg-[#111] border border-[#333] p-3 text-cyan-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3">Source Backed</h3>
        <p className="text-sm text-white/50 leading-relaxed">
          Every single claim is linked directly to the primary source so you can verify the information and trust the output.
        </p>
      </div>
    </div>
  );
};
