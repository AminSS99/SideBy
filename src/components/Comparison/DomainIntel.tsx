import React from "react";
import { ShieldCheck, Plane, Landmark, Cpu, Recycle, TrendingUp } from "lucide-react";

interface DomainIntelProps {
  item: any;
  category: string;
}

const DomainIntel = ({ item, category }: DomainIntelProps) => {
  if (category === "travel") {
    return (
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Safety Index</p>
            <p className="text-xs font-bold">Elite Secure</p>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl flex items-center gap-3">
          <Plane className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Connectivity</p>
            <p className="text-xs font-bold">Hub Node</p>
          </div>
        </div>
      </div>
    );
  }

  if (category === "tech") {
    return (
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl flex items-center gap-3">
          <Recycle className="w-5 h-5 text-purple-400" />
          <div>
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">Resale Value</p>
            <p className="text-xs font-bold">A+ Tier</p>
          </div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-2xl flex items-center gap-3">
          <Cpu className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Life Expectancy</p>
            <p className="text-xs font-bold">5-7 Years</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DomainIntel;