import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { brand } from "@/config/brand";

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerLabel: string;
  footerLinkLabel: string;
  footerHref: string;
}

const AuthPageShell = ({
  eyebrow,
  title,
  description,
  children,
  footerLabel,
  footerLinkLabel,
  footerHref,
}: AuthPageShellProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.from(".auth-logo", { 
      y: -20, 
      opacity: 0, 
      duration: 0.8, 
      ease: "power3.out" 
    })
    .from(".auth-text > *", { 
      y: 20, 
      opacity: 0, 
      stagger: 0.1, 
      duration: 0.8, 
      ease: "power3.out" 
    }, "-=0.6")
    .from(".auth-card", { 
      x: 30, 
      opacity: 0, 
      duration: 1, 
      ease: "expo.out" 
    }, "-=0.8");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-white selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-orange-600/[0.04] blur-[60px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <Link
          to="/"
          className="auth-logo mb-16 flex items-center gap-4 self-start group"
        >
          <img src="/sideby.ico" alt="SideBy" className="h-12 w-12 object-contain rounded-sm group-hover:opacity-80 transition-all" />
          <div>
            <span className="block font-serif text-xl tracking-tight text-[#fdfbf7] group-hover:text-orange-50 transition-colors">{brand.productName}</span>
            <span className="block text-[9px] uppercase tracking-[0.3em] text-[#fdfbf7]/40">
              Operated by {brand.companyName}
            </span>
          </div>
        </Link>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="auth-text space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500">
              {eyebrow}
            </p>
            <h1 className="max-w-xl font-serif text-5xl md:text-6xl lg:text-7xl tracking-tight text-[#fdfbf7] leading-[1.1]">
              {title}
            </h1>
            <p className="max-w-xl text-lg font-light leading-relaxed text-[#fdfbf7]/60">
              {description}
            </p>
            <a
              href={brand.url}
              className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 transition-colors hover:text-orange-400 mt-4"
            >
              {brand.operatedByLine}
            </a>
          </div>

          <div className="auth-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 shadow-2xl md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              {children}
              <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/40">
                {footerLabel}{" "}
                <Link to={footerHref} className="text-[#fdfbf7] transition-colors hover:text-orange-400 underline decoration-[#fdfbf7]/30 underline-offset-4">
                  {footerLinkLabel}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPageShell;