import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ShieldCheck, Lock } from "lucide-react";
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
      y: -25,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .from(".auth-card", {
      y: 35,
      opacity: 0,
      scale: 0.98,
      duration: 1,
      ease: "power4.out"
    }, "-=0.5")
    .from(".auth-footer-features", {
      opacity: 0,
      y: 10,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-white selection:bg-orange-500/30 flex flex-col justify-center items-center py-16 px-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-orange-600/[0.03] blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-stretch">
        {/* Centered Logo */}
        <Link
          to="/"
          className="auth-logo mb-8 flex flex-col items-center gap-2 group self-center text-center"
        >
          <img
            src="/sideby.ico"
            alt="SideBy Logo"
            className="h-12 w-12 object-contain rounded-xl shadow-lg transition-transform group-hover:scale-105"
          />
          <div className="mt-1">
            <span className="block font-serif text-lg tracking-tight text-[#fdfbf7] group-hover:text-orange-50 transition-colors">
              {brand.productName}
            </span>
            <span className="block text-[8px] uppercase tracking-[0.3em] text-[#fdfbf7]/40 mt-0.5">
              Operated by {brand.companyName}
            </span>
          </div>
        </Link>

        {/* Card with glowing gradient border */}
        <div className="auth-card relative">
          {/* Subtle colored border glow wrapper */}
          <div className="absolute -inset-px bg-gradient-to-br from-orange-500/25 via-rose-500/15 to-amber-500/25 rounded-2xl opacity-80 blur-[2px] pointer-events-none" />

          <div className="relative rounded-2xl bg-[#09090b] border border-white/5 p-8 md:p-10 shadow-2xl overflow-hidden">
            {/* Soft inner glow top right */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[40px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              {/* Header section inside card */}
              <div className="text-center mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500 mb-2">
                  {eyebrow}
                </p>
                <h2 className="font-serif text-2xl md:text-3xl text-[#fdfbf7] tracking-tight leading-tight">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-[#fdfbf7]/50 font-light leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Children (Form / Authentication flow) */}
              {children}

              {/* Footer navigation */}
              <div className="mt-8 text-center text-xs font-light text-[#fdfbf7]/50 border-t border-white/5 pt-6">
                {footerLabel}{" "}
                <Link
                  to={footerHref}
                  className="text-orange-500 hover:text-orange-400 transition-colors font-medium ml-1 inline-flex items-center gap-0.5"
                >
                  {footerLinkLabel}
                  <span className="text-xs transition-transform group-hover:translate-x-0.5">&rarr;</span>
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
  );
};

export default AuthPageShell;