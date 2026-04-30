import React, { useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ComparisonData } from './types';
import { panelClass } from './constants';
import { Layers } from 'lucide-react';

export const RadarChartPanel = ({ result }: { result: ComparisonData }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.from(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      y: 20,
      duration: 1,
      ease: "expo.out"
    });
  }, { scope: containerRef });

  if (!result.dimensions || result.dimensions.length === 0) return null;

  return (
    <div ref={containerRef} className={`${panelClass} p-8 lg:p-12 mb-10 overflow-hidden relative`}>
      {/* Background ambient glows matching entity colors */}
      <div 
        className="absolute top-0 left-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none rounded-full"
        style={{ backgroundColor: result.entities.a.hex }}
      />
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none rounded-full"
        style={{ backgroundColor: result.entities.b.hex }}
      />

      <div className="flex flex-col md:flex-row gap-10 items-center">
        <div className="md:w-1/3 z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-[#333] bg-[#111] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/60">
            <Layers className="h-3.5 w-3.5" />
            Capabilities Radar
          </div>
          <h3 className="font-serif text-3xl text-[#fdfbf7] mb-4">Strategic Mapping</h3>
          <p className="text-sm text-[#fdfbf7]/60 leading-relaxed mb-6">
            A multidimensional visualization of how {result.entities.a.name} and {result.entities.b.name} compare across core engineering and business vectors.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-sm border border-white/20" style={{ backgroundColor: `${result.entities.a.hex}80` }} />
              <span className="text-sm font-serif text-[#fdfbf7]">{result.entities.a.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-sm border border-white/20" style={{ backgroundColor: `${result.entities.b.hex}80` }} />
              <span className="text-sm font-serif text-[#fdfbf7]">{result.entities.b.name}</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3 h-[350px] z-10">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={result.dimensions}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#fdfbf7', fontSize: 11, fontFamily: "ui-sans-serif, system-ui, sans-serif", opacity: 0.6 }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0c0b0a', borderColor: '#333', borderRadius: '4px', padding: '12px' }}
                itemStyle={{ fontWeight: 'bold' }}
                labelStyle={{ color: '#888', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Radar 
                name={result.entities.a.name} 
                dataKey="a" 
                stroke={result.entities.a.hex} 
                fill={result.entities.a.hex} 
                fillOpacity={0.3} 
                strokeWidth={2}
              />
              <Radar 
                name={result.entities.b.name} 
                dataKey="b" 
                stroke={result.entities.b.hex} 
                fill={result.entities.b.hex} 
                fillOpacity={0.3} 
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};