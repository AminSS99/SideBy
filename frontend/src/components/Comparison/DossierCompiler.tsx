import React, { useState, useEffect } from "react";
import { Shield, FileText, Cpu, Database, Globe, CheckCircle2 } from "lucide-react";

const DossierCompiler = ({ onComplete }: { onComplete: () => void }) => {
  const [steps, setSteps] = useState([
    { label: "Initializing Dossier Protocol...", status: "active" },
    { label: "Aggregating Sentiment Data...", status: "pending" },
    { label: "Syncing Market Forecasts...", status: "pending" },
    { label: "Generating AI Verdict...", status: "pending" },
  ]);

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSteps(prev => prev.map((step, idx) => {
          if (idx === currentStep) return { ...step, status: "complete" };
          if (idx === currentStep + 1) return { ...step, status: "active" };
          return step;
        }));
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)]" />
      
      <div className="max-w-md w-full space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-purple-600/20 rounded-3xl border border-purple-500/50 flex items-center justify-center mx-auto relative overflow-hidden">
            <FileText className="w-10 h-10 text-purple-400 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Compiling Dossier</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Secure Encryption Level 4 Activated</p>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
              step.status === 'complete' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-100' :
              step.status === 'active' ? 'bg-purple-500/10 border-purple-500/30 scale-105 opacity-100' :
              'bg-white/5 border-white/5 opacity-40'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                {step.status === 'complete' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                 step.status === 'active' ? <Cpu className="w-4 h-4 text-purple-400 animate-spin" /> :
                 <Database className="w-4 h-4 text-white/20" />}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">{step.label}</span>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex justify-between items-center text-[8px] font-mono text-white/20 uppercase">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            <span>Node: EU-West-1</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>Secure Protocol: v3.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DossierCompiler;