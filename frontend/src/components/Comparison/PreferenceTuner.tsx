import React from "react";
import { Slider } from "@/components/ui/slider";

interface PreferenceTunerProps {
  metrics: string[];
  weights: Record<string, number>;
  onWeightChange: (metric: string, val: number) => void;
}

const PreferenceTuner = ({ metrics, weights, onWeightChange }: PreferenceTunerProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-white/5 rounded-3xl border border-white/10 mb-12">
      <div className="col-span-full">
        <h3 className="text-sm font-black italic uppercase tracking-widest text-purple-400 mb-2">Preference Settings</h3>
        <p className="text-[10px] text-white/40 uppercase font-bold">Adjust the sliders to tell the AI what matters most to you.</p>
      </div>
      
      {metrics.map((metric) => (
        <div key={metric} className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{metric}</span>
            <span className="text-xs font-black text-purple-400">{(weights[metric] * 10).toFixed(0)}x</span>
          </div>
          <Slider
            defaultValue={[weights[metric]]}
            max={10}
            step={1}
            onValueChange={(vals) => onWeightChange(metric, vals[0])}
            className="[&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-400"
          />
        </div>
      ))}
    </div>
  );
};

export default PreferenceTuner;