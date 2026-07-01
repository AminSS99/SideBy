import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ShieldCheck, Lock } from "lucide-react";
import { brand } from "@/config/brand";
import InteractiveConstellation from "./InteractiveConstellation";

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
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.from(".auth-logo", {
      y: -20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .from(".auth-badge", {
      scale: 0.8,
      opacity: 0,
      duration: 0.6,
      ease: "back.out(1.7)"
    }, "-=0.5")
    .from([".auth-title", ".auth-description", ".auth-operator"], {
      y: 25,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.4")
    .from(".auth-card", {
      x: 40,
      rotationY: 12,
      transformPerspective: 1000,
      opacity: 0,
      duration: 1.2,
      ease: "power4.out"
    }, "-=0.8")
    .from(".auth-footer-features", {
      opacity: 0,
      y: 10,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6");
  }, { scope: containerRef });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const normX = x / (rect.width / 2);
    const normY = y / (rect.height / 2);

    gsap.to(card, {
      rotateY: normX * 8,
      rotateX: -normY * 8,
      transformPerspective: 1000,
      ease: "power2.out",
      duration: 0.5,
    });
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    gsap.to(card, {
      rotateY: 0,
      rotateX: 0,
      transformPerspective: 1000,
      ease: "power2.out",
      duration: 0.8,
    });
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#030303] text-white selection:bg-orange-500/30 flex items-center justify-center py-16 px-6 relative overflow-hidden"
    >
      {/* Background patterns */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-orange-600/[0.02] blur-[90px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] items-center">

          {/* Left branding column */}
          <div className="auth-left-column relative flex flex-col justify-center min-h-[400px] lg:min-h-0 z-10 py-8 lg:py-0 rounded-2xl overflow-hidden p-6 lg:p-10 border border-white/[0.02] bg-white/[0.01] backdrop-blur-[1px]">
            {/* Interactive particle canvas */}
            <InteractiveConstellation />

            <div className="relative z-10 space-y-6 select-none">
              {/* Logo */}
              <Link
                to="/"
                className="auth-logo flex items-center gap-4 group self-start"
              >
                <img
                  src="/sideby.ico"
                  alt="SideBy"
                  className="h-12 w-12 object-contain rounded-xl shadow-lg transition-transform group-hover:scale-105"
                />
                <div>
                  <span className="block font-serif text-2xl tracking-tight text-[#fdfbf7] group-hover:text-orange-50 transition-colors">
                    {brand.productName}
                  </span>
                  <span className="block text-[9px] uppercase tracking-[0.3em] text-[#fdfbf7]/40 mt-0.5">
                    Operated by {brand.companyName}
                  </span>
                </div>
              </Link>

              {/* Glowing Beta Pill Badge */}
              <div className="auth-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-semibold tracking-wider uppercase shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)] self-start">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                {eyebrow}
              </div>

              {/* Title */}
              <h1 className="auth-title max-w-xl font-serif text-5xl md:text-6xl tracking-tight text-[#fdfbf7] leading-[1.1]">
                {title}
              </h1>

              {/* Description */}
              <p className="auth-description max-w-lg text-lg font-light leading-relaxed text-[#fdfbf7]/50">
                {description}
              </p>

              {/* Footer operator info */}
              <div className="auth-operator pt-4">
                <a
                  href={brand.url}
                  className="auth-operator inline-block text-[10px] font-bold uppercase tracking-widest text-[#fdfbf7]/30 transition-colors hover:text-orange-400"
                >
                  {brand.operatedByLine}
                </a>
              </div>
            </div>
          </div>

          {/* Right auth-form column */}
          <div className="flex flex-col items-center lg:items-stretch justify-center relative z-20">
            <div
              ref={cardRef}
              className="auth-card w-full max-w-[420px] relative will-change-transform [transform-style:preserve-3d]"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Subtle colored border glow wrapper */}
              <div className="absolute -inset-px bg-gradient-to-br from-orange-500/25 via-rose-500/15 to-amber-500/25 rounded-2xl opacity-80 blur-[2px] pointer-events-none" />

              <div className="relative rounded-2xl bg-[#09090b] border border-white/5 p-8 md:p-10 shadow-2xl overflow-hidden">
                {/* Soft inner glow top right */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[40px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                  {children}

                  {/* Footer navigation */}
                  <div className="mt-8 text-center text-xs font-light text-[#fdfbf7]/50 border-t border-white/5 pt-6">
                    {footerLabel}{" "}
                    <Link
                      to={footerHref}
                      className="text-orange-500 hover:text-orange-400 transition-colors font-medium ml-1 inline-flex items-center gap-0.5"
                    >
                      {footerLinkLabel}
                      <span className="text-xs">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* trust/security badges below card */}
            <div className="auth-footer-features mt-6 flex justify-center items-center gap-6 text-[10px] font-medium tracking-wider text-white/30 uppercase">
              <div className="flex items-center gap-1.5 hover:text-white/40 transition-colors duration-200 cursor-default">
                <ShieldCheck className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>SOC 2 Ready</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-white/40 transition-colors duration-200 cursor-default">
                <Lock className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>256-bit Encrypted</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPageShell;
