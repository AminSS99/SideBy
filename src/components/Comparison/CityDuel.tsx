import React, { useState } from "react";
import { cities, CityData } from "@/data/cities";
import GlassCard from "../GlassCard";
import { Shield, Plane, Utensils, Hotel, TrendingUp, Heart, Briefcase, Languages, MapPin } from "lucide-react";
import MetricBadge from "./MetricBadge";
import RadarMetrics from "./RadarMetrics";
import { Progress } from "@/components/ui/progress";

const CityDuel = () => {
  const [cityA, setCityA] = useState<CityData>(cities[0]);
  const [cityB, setCityB] = useState<CityData>(cities[1]);

  const CityPanel = ({ city, side }: { city: CityData; side: "left" | "right" }) => (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <GlassCard className="relative h-64 p-0 group overflow-hidden">
        <img src={city.image} alt={city.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-sm font-medium text-blue-400 mb-1">{city.country}</p>
          <h2 className="text-4xl font-bold mb-2">{city.name}</h2>
          <p className="text-white/70 italic text-sm">{city.tagline}</p>
        </div>
      </GlassCard>

      {/* Bento Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Safety Metric */}
        <GlassCard glowColor="blue">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-white/80">
              <Shield className="w-4 h-4 text-blue-400" /> Safety Index
            </h3>
            <span className="text-2xl font-bold">{city.metrics.safety}</span>
          </div>
          <Progress value={city.metrics.safety} className="h-1.5 bg-white/10" />
          <p className="mt-2 text-xs text-white/50">Based on local crime stats and emergency access.</p>
        </GlassCard>

        {/* Connectivity */}
        <GlassCard>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white/80">
            <Plane className="w-4 h-4 text-purple-400" /> Connectivity
          </h3>
          <div className="flex flex-wrap gap-2">
            <MetricBadge label="Transport" score={city.metrics.connectivity.transport} icon={<MapPin className="w-3 h-3" />} />
            <MetricBadge label="Flights" score={city.metrics.connectivity.flights} icon={<Plane className="w-3 h-3" />} />
          </div>
        </GlassCard>

        {/* Costs */}
        <GlassCard className="md:col-span-2" glowColor="orange">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white/80">
            <TrendingUp className="w-4 h-4 text-orange-400" /> Estimated Daily Budget
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Hotel className="w-5 h-5 mx-auto mb-2 text-white/40" />
              <p className="text-lg font-bold">€{city.metrics.cost.hotels}</p>
              <p className="text-[10px] text-white/40">Sleep</p>
            </div>
            <div className="text-center">
              <Utensils className="w-5 h-5 mx-auto mb-2 text-white/40" />
              <p className="text-lg font-bold">€{city.metrics.cost.food}</p>
              <p className="text-[10px] text-white/40">Food</p>
            </div>
            <div className="text-center">
              <Plane className="w-5 h-5 mx-auto mb-2 text-white/40" />
              <p className="text-lg font-bold">€{city.metrics.cost.flights}</p>
              <p className="text-[10px] text-white/40">Travel</p>
            </div>
          </div>
        </GlassCard>

        {/* Purpose Fit Radar */}
        <GlassCard className="md:col-span-2 flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2 self-start text-white/80">Vibe Check</h3>
          <RadarMetrics data={city.metrics.purpose} />
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-white/60"><Heart className="w-3 h-3 text-red-400" /> Romance</div>
            <div className="flex items-center gap-1 text-[10px] text-white/60"><Briefcase className="w-3 h-3 text-blue-400" /> Business</div>
          </div>
        </GlassCard>

        {/* Culture Tags */}
        <GlassCard className="md:col-span-2">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white/80">
            <Languages className="w-4 h-4 text-emerald-400" /> Cultural Identity
          </h3>
          <div className="flex flex-wrap gap-2">
            {city.culture.tags.map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-white/40">Language Friendliness</span>
            <span className="text-sm font-bold text-emerald-400">{city.culture.languageScore}%</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <CityPanel city={cityA} side="left" />
        <div className="hidden md:flex items-center justify-center">
          <div className="h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest text-white/40">
              VS
            </div>
          </div>
        </div>
        <CityPanel city={cityB} side="right" />
      </div>
    </div>
  );
};

export default CityDuel;