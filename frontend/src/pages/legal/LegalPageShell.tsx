import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { brand } from "@/config/brand";
import { BrandFooter } from "@/components/brand/BrandFooter";

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
      <header className="border-b border-[#2a2a2a] bg-[#030303] sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="flex h-8 w-8 items-center justify-center border border-[#333] bg-[#111] font-serif text-sm text-[#fdfbf7] transition-all group-hover:border-orange-500/50 group-hover:text-orange-400">
              S
            </div>
            <span className="font-serif tracking-tight text-[#fdfbf7] group-hover:text-orange-50 transition-colors">SideBy</span>
          </Link>
          <Link to="/contact" className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
            Contact Support
          </Link>
        </div>
      </header>

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

      <footer className="border-t border-[#2a2a2a] bg-[#080808] py-8">
        <div className="mx-auto flex max-w-4xl flex-col md:flex-row items-center justify-between px-6 gap-4">
          <BrandFooter />
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LegalPageShell;