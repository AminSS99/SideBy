import React, { useState } from "react";
import { cities, CityData } from "@/data/cities";
import GlassCard from "../GlassCard";
import { 
  Shield, Plane, Utensils, Hotel, TrendingUp, Heart, 
  Briefcase, Languages, MapPin, Sun, CloudRain, Star,
  CheckCircle2, XCircle, Users
} from "lucide-react";
import MetricBadge from "./MetricBadge";
import RadarMetrics from "./RadarMetrics";
import ClimateChart from "./ClimateChart";
import CitySelector from "./CitySelector";
import { Progress } from "@/components/ui/progress";

const CityDuel = () => {
  const [cityA, setCityA] = useState<CityData>(cities[0]);
  const [cityB, setCityB] = useState<CityData>(cities[1]);

  const CityPanel = ({ city, onCityChange, label }: { city: CityData; onCityChange: (c: CityData) => void; label: string }) => (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CitySelector label={label} currentCityId={city.id} onSelect={onCityChange} />
      
      {/* Header Card */}
      <GlassCard className="relative h-72 p-0 group overflow-hidden shadow-2xl">
        <img src={city.image} alt={city.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">{city.country}</p>
              <h2 className="text-5xl font-black mb-2 tracking-tighter">{city.name}</h2>
              <p className="text-white/70 italic text-sm">{city.tagline}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center border border-white/10">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mx-auto" />
              <span className="text-xs font-bold block mt-1">{city.metrics.socialSentiment}%</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Bento Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Climate & Weather */}
        <GlassCard glowColor="purple">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-white/80">
              <Sun className="w-4 h-4 text-yellow-400" /> Climate Graph
            </h3>
            <span className="text-[10px] font-bold text-white/40 uppercase">Optimal: {city.metrics.climate.bestMonth}</span>
          </div>
          <ClimateChart temps={city.metrics.climate.temp} />
          <p className="mt-2 text-[10px] text-white/40 text-center italic">Average monthly temperatures (°C)</p>
        </GlassCard>

        {/* Safety & Inclusivity */}
        <GlassCard>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold flex items-center gap-2 text-white/80">
                  <Shield className="w-3 h-3 text-blue-400" /> Safety
                </span>
                <span className="text-sm font-bold">{city.metrics.safety}</span>
              </div>
              <Progress value={city.metrics.safety} className="h-1 bg-white/10" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold flex items-center gap-2 text-white/80">
                  <Users className="w-3 h-3 text-purple-400" /> Inclusivity
                </span>
                <span className="text-sm font-bold">{city.metrics.inclusivity}</span>
              </div>
              <Progress value={city.metrics.inclusivity} className="h-1 bg-white/10" />
            </div>
          </div>
        </GlassCard>

        {/* Attractions Gallery */}
        <GlassCard className="md:col-span-2">
          <h3 className="text-sm font-semibold mb-4 text-white/80">Must-See Landmarks</h3>
          <div className="grid grid-cols-2 gap-4">
            {city.landmarks.map(landmark => (
              <div key={landmark.name} className="relative h-24 rounded-xl overflow-hidden group">
                <img src={landmark.image} alt={landmark.name} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 p-3 flex flex-col justify-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{landmark.type}</span>
                  <span className="text-xs font-bold text-white truncate">{landmark.name}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Costs */}
        <GlassCard className="md:col-span-2" glowColor="orange">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-white/80">
              <TrendingUp className="w-4 h-4 text-orange-400" /> Daily Budget (Est.)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/40 uppercase">Visa Entry:</span>
              {city.metrics.visaRequired ? 
                <XCircle className="w-4 h-4 text-red-400" /> : 
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              }
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 p-3 rounded-2xl text-center">
              <Hotel className="w-4 h-4 mx-auto mb-2 text-white/40" />
              <p className="text-lg font-bold">€{city.metrics.cost.hotels}</p>
              <p className="text-[10px] text-white/40 uppercase font-bold">Stay</p>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl text-center">
              <Utensils className="w-4 h-4 mx-auto mb-2 text-white/40" />
              <p className="text-lg font-bold">€{city.metrics.cost.food}</p>
              <p className="text-[10px] text-white/40 uppercase font-bold">Food</p>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl text-center">
              <Plane className="w-4 h-4 mx-auto mb-2 text-white/40" />
              <p className="text-lg font-bold">€{city.metrics.cost.flights}</p>
              <p className="text-[10px] text-white/40 uppercase font-bold">Travel</p>
            </div>
          </div>
        </GlassCard>

        {/* Vibe Radar */}
        <GlassCard className="md:col-span-2">
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold mb-2 self-start text-white/80">Purpose Fit</h3>
            <RadarMetrics data={city.metrics.purpose} />
          </div>
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <CityPanel city={cityA} onCityChange={setCityA} label="Contender A" />
        <div className="hidden lg:flex items-center justify-center">
          <div className="h-[80%] w-px bg-gradient-to-b from-transparent via-white/10 to-transparent relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] border border-white/10 px-6 py-4 rounded-full font-black text-xl italic text-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              VS
            </div>
          </div>
        </div>
        <CityPanel city={cityB} onCityChange={setCityB} label="Contender B" />
      </div>
    </div>
  );
};

export default CityDuel;