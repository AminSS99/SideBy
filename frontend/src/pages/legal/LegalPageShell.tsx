import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MarketingFooter } from "@/components/brand/MarketingFooter";
import { MarketingNav } from "@/components/brand/MarketingNav";

interface LegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalPageShell = ({ title, lastUpdated, children }: LegalPageShellProps) => {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".legal-header", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".legal-content", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="min-h-screen bg-[#030303] text-[#fdfbf7] selection:bg-orange-500/30 flex flex-col">
      <MarketingNav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-16 md:py-24">
        <div className="legal-header mb-16 border-b border-[#2a2a2a] pb-8">
          <h1 className="font-serif text-4xl md:text-5xl text-[#fdfbf7] tracking-tight mb-4">{title}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Last Updated: {lastUpdated}
          </p>
        </div>
        
        <div className="legal-content prose prose-invert prose-p:text-white/70 prose-headings:font-serif prose-headings:font-normal prose-headings:text-[#fdfbf7] prose-a:text-orange-400 max-w-none">
          {children}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default LegalPageShell;
