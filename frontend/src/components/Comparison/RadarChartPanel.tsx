import React, { useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ComparisonData } from './types';
import { panelClass } from './constants';
import { Layers } from "@/components/icons";
import { useIsMobile } from "@/hooks/use-mobile";

const wrapLabel = (text: string, max: number) => {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
};

const RadarTick = ({ x, y, cx, payload, compact }: { x?: number; y?: number; cx?: number; payload?: { value: string }; compact: boolean }) => {
  if (x === undefined || y === undefined || !payload) return null;
  const lines = wrapLabel(payload.value, compact ? 9 : 18);
  const anchor = cx !== undefined && Math.abs(x - cx) < 6 ? "middle" : x > (cx ?? 0) ? "start" : "end";
  return (
    <text x={x} y={y - ((lines.length - 1) * 6)} textAnchor={anchor} fill="#fdfbf7" fillOpacity={0.65} fontSize={compact ? 10 : 11}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>{l}</tspan>
      ))}
    </text>
  );
};

export const RadarChartPanel = ({ result }: { result: ComparisonData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const compact = useIsMobile();

  useGSAP(() => {
    if (!containerRef.current) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(containerRef.current, {
        opacity: 0,
        scale: 0.97,
        y: 18,
        duration: 0.75,
        ease: "expo.out",
        clearProps: "transform,opacity",
      });
    });

    return () => mm.revert();
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

        <div className="w-full md:w-2/3 h-[340px] z-10">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius={compact ? "58%" : "75%"} data={result.dimensions} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={(props: object) => <RadarTick {...(props as React.ComponentProps<typeof RadarTick>)} compact={compact} />}
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