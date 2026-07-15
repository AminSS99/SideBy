import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react";
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      y: 30,
      rotationX: 5,
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
    if (!card || !window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      className="relative min-h-screen overflow-hidden bg-[#030303] px-4 py-5 text-white selection:bg-orange-500/30 sm:px-6 sm:py-8 lg:flex lg:items-center"
    >
      {/* Background patterns */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-orange-600/[0.09] blur-[130px]" />
        <div className="absolute -right-40 bottom-0 h-[460px] w-[460px] rounded-full bg-fuchsia-600/[0.06] blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-7 flex items-center justify-between lg:hidden">
          <Link to="/" className="auth-logo flex items-center gap-3">
            <img src="/icon.svg" alt="SideBy" className="h-9 w-9 rounded-xl object-contain" />
            <span className="font-serif text-xl text-[#fdfbf7]">{brand.productName}</span>
          </Link>
          <Link to="/" aria-label="Back to home" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">

          {/* Left branding column */}
          <div className="auth-left-column relative z-10 order-2 hidden min-h-[650px] flex-col justify-between overflow-hidden rounded-[32px] border border-white/[0.06] bg-white/[0.025] p-10 backdrop-blur-[1px] lg:flex xl:p-12">
            {/* Interactive particle canvas */}
            <InteractiveConstellation />

            <div className="relative z-10 space-y-6 select-none">
              {/* Logo */}
              <Link
                to="/"
                className="auth-logo flex items-center gap-4 group self-start"
              >
                <img
                  src="/icon.svg"
                  alt="SideBy"
                  className="h-11 w-11 rounded-xl object-contain shadow-lg transition-transform group-hover:scale-105"
                />
                <div>
                  <span className="block font-serif text-2xl tracking-tight text-[#fdfbf7] group-hover:text-orange-50 transition-colors">
                    {brand.productName}
                  </span>
                  <span className="block text-[9px] uppercase tracking-[0.3em] text-[#fdfbf7]/60 mt-0.5">
                    Operated by {brand.companyName}
                  </span>
                </div>
              </Link>

              {/* Glowing Beta Pill Badge */}
              <div className="auth-badge inline-flex items-center gap-2 self-start rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-300 shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)]">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </div>

              {/* Title */}
              <h1 className="auth-title max-w-xl font-serif text-5xl leading-[1.02] tracking-tight text-[#fdfbf7] xl:text-6xl">
                {title}
              </h1>

              {/* Description */}
              <p className="auth-description max-w-lg text-base font-light leading-7 text-[#fdfbf7]/50">
                {description}
              </p>

              <div className="auth-operator grid gap-3 pt-4 sm:grid-cols-3">
                {["Cited research", "Private workspace", "Export anytime"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/[0.07] bg-black/20 p-3.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <a href={brand.url} className="relative z-10 text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 transition-colors hover:text-orange-300">{brand.operatedByLine}</a>
          </div>

          {/* Right auth-form column */}
          <div className="relative z-20 order-1 flex flex-col items-center justify-center lg:order-2 lg:items-stretch">
            <div
              ref={cardRef}
              className="auth-card relative w-full max-w-[460px] will-change-transform [transform-style:preserve-3d]"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Subtle colored border glow wrapper */}
              <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-br from-orange-500/35 via-rose-500/20 to-fuchsia-500/25 opacity-80 blur-[2px]" />

              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#09090b]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-8 md:p-10">
                {/* Soft inner glow top right */}
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-[50px]" />

                <div className="relative z-10 mb-7 lg:hidden">
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300">
                    <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
                  </div>
                  <h1 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-[#fdfbf7] sm:text-4xl">{title}</h1>
                  <p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
                </div>

                <div className="relative z-10">
                  {children}

                  {/* Footer navigation */}
                  <div className="mt-8 border-t border-white/[0.07] pt-6 text-center text-xs font-light text-[#fdfbf7]/50">
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
            <div className="auth-footer-features mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[9px] font-medium uppercase tracking-wider text-white/30">
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
