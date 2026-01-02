import React from "react";
import { User, Briefcase, Wallet, Heart, Zap, Plane } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  icon: any;
  description: string;
  weights: Record<string, number>;
}

interface PersonaPresetsProps {
  category: string;
  onApply: (weights: Record<string, number>) => void;
}

const PersonaPresets = ({ category, onApply }: PersonaPresetsProps) => {
  const travelPersonas: Persona[] = [
    { 
      id: "nomad", name: "Digital Nomad", icon: Briefcase, 
      description: "Prioritizes tech, accessibility & budget.",
      weights: { budget: 8, accessibility: 9, culture: 7, safety: 6, climate: 5 } 
    },
    { 
      id: "luxury", name: "Luxury Traveler", icon: Heart, 
      description: "Focus on safety, culture & climate.",
      weights: { budget: 2, accessibility: 6, culture: 9, safety: 10, climate: 8 } 
    },
    { 
      id: "budget", name: "Backpacker", icon: Wallet, 
      description: "Strictly budget & accessibility focused.",
      weights: { budget: 10, accessibility: 7, culture: 8, safety: 4, climate: 5 } 
    }
  ];

  const techPersonas: Persona[] = [
    { 
      id: "pro", name: "Power User", icon: Zap, 
      description: "Performance & Camera are everything.",
      weights: { camera: 10, performance: 10, battery: 8, display: 9, value: 3 } 
    },
    { 
      id: "casual", name: "Value Seeker", icon: Wallet, 
      description: "Focus on battery & long-term value.",
      weights: { camera: 5, performance: 6, battery: 10, display: 7, value: 10 } 
    }
  ];

  const activePersonas = category === "travel" ? travelPersonas : category === "tech" ? techPersonas : [];

  if (activePersonas.length === 0) return null;

  return (
    <div className="mb-8 p-4 bg-white/5 rounded-3xl border border-white/5">
      <div className="flex items-center gap-2 mb-4 px-2">
        <User className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Persona Calibrations</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activePersonas.map((p) => (
          <button
            key={p.id}
            onClick={() => onApply(p.weights)}
            className="group flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <p.icon className="w-5 h-5 text-white/40 group-hover:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-black italic uppercase tracking-tighter text-white group-hover:text-blue-400">{p.name}</p>
              <p className="text-[9px] text-white/30 font-bold leading-tight mt-0.5">{p.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonaPresets;