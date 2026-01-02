import React from "react";
import { cities, CityData } from "@/data/cities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CitySelectorProps {
  currentCityId: string;
  onSelect: (city: CityData) => void;
  label: string;
}

const CitySelector = ({ currentCityId, onSelect, label }: CitySelectorProps) => {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 px-1">{label}</span>
      <Select 
        value={currentCityId} 
        onValueChange={(id) => {
          const selected = cities.find(c => c.id === id);
          if (selected) onSelect(selected);
        }}
      >
        <SelectTrigger className="w-full bg-white/5 border-white/10 rounded-xl h-12 text-lg font-bold">
          <SelectValue placeholder="Select City" />
        </SelectTrigger>
        <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id} className="hover:bg-white/10">
              {city.name}, {city.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CitySelector;