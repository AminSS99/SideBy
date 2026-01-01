import React, { useState } from "react";
import { ComparisonItem } from "@/data/mockDB";
import { Search, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface SearchSelectorProps {
  items: ComparisonItem[];
  selectedItem: ComparisonItem;
  onSelect: (item: ComparisonItem) => void;
  label: string;
}

const SearchSelector = ({ items, selectedItem, onSelect, label }: SearchSelectorProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.subtext.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 mb-4 w-full">
      <span className="text-[10px] uppercase tracking-widest font-black text-white/30 px-1">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-between w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-left hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-blue-500/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-blue-400 leading-tight uppercase">{selectedItem.subtext}</span>
              <span className="text-lg font-black italic tracking-tighter leading-tight">{selectedItem.name}</span>
            </div>
            <ChevronDown className="w-5 h-5 text-white/40" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-[#0a0a0a] border-white/10 text-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-white/5 bg-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input 
                placeholder="Search..." 
                className="pl-9 h-10 bg-black/40 border-white/10 rounded-xl text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left mb-1 ${
                  selectedItem.id === item.id ? "bg-blue-600/20 text-blue-400" : "hover:bg-white/5"
                }`}
              >
                <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                <div className="flex flex-col">
                  <span className="text-xs font-black italic leading-tight">{item.name}</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase">{item.subtext}</span>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchSelector;