import { useId, useRef, useState, type PointerEvent } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TextHoverEffectProps {
  text: string;
  duration?: number;
  className?: string;
}

export function TextHoverEffect({ text, duration = 0.12, className }: TextHoverEffectProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = useId().replaceAll(":", "");
  const maskId = useId().replaceAll(":", "");
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    setMaskPosition({
      cx: `${((event.clientX - rect.left) / rect.width) * 100}%`,
      cy: `${((event.clientY - rect.top) / rect.height) * 100}%`,
    });
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 600 150"
      role="img"
      aria-label={text}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={handlePointerMove}
      className={cn("select-none overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="52%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
        <motion.radialGradient
          id={maskId}
          gradientUnits="objectBoundingBox"
          r="30%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id={`${maskId}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${maskId})`} />
        </mask>
      </defs>

      <text
        x="50%"
        y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.75"
        className="fill-white/[0.025] stroke-white/20 font-serif text-[8.5rem] font-medium tracking-[-0.055em]"
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke={`url(#${gradientId})`}
        strokeWidth="0.9"
        className="fill-transparent font-serif text-[8.5rem] font-medium tracking-[-0.055em]"
        initial={{ strokeDashoffset: 900, strokeDasharray: 900 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 3.4, ease: "easeInOut" }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={`url(#${gradientId})`}
        mask={`url(#${maskId}-mask)`}
        opacity={hovered ? 0.9 : 0.32}
        className="font-serif text-[8.5rem] font-medium tracking-[-0.055em] transition-opacity duration-300"
      >
        {text}
      </text>
    </svg>
  );
}

export function FooterBackgroundGradient() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(90% 80% at 50% 100%, rgba(249,115,22,.13) 0%, rgba(217,70,239,.07) 38%, transparent 72%)",
      }}
    />
  );
}

