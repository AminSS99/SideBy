import React from "react";
import GlassCard from "../GlassCard";
import { ImageIcon } from "lucide-react";

interface ContenderGalleryProps {
  itemA: any;
  itemB: any;
}

const ContenderGallery = ({ itemA, itemB }: ContenderGalleryProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <ImageIcon className="w-3 h-3 text-white/20" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Visual Intelligence</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[itemA, itemB].map((item, idx) => (
          <React.Fragment key={item.id}>
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 group">
              <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{item.name}</span>
              </div>
            </div>
            {/* Mocked secondary images for depth */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 opacity-60 hover:opacity-100 transition-opacity">
               <img src={`https://images.unsplash.com/photo-${idx === 0 ? '1480714378408-67cf0d13bc1b' : '1503899036084-c55cdd92da26'}?auto=format&fit=crop&w=400&q=80`} className="w-full h-full object-cover" alt="" />
               <div className="absolute inset-0 bg-black/40" />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ContenderGallery;