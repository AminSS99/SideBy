import { useLocation, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { brand } from "@/config/brand";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".nf-404", { scale: 0.8, opacity: 0, duration: 1, ease: "back.out(1.5)" })
      .from(".nf-text", { y: 20, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".nf-btn", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.4");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-[#030303] text-white relative overflow-hidden">
      {/* Background Grid & Glow Effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-orange-600/[0.03] blur-[60px]" />
      </div>

      <div className="relative z-10 text-center px-6">
        <h1 className="nf-404 font-serif text-8xl md:text-9xl font-black text-[#fdfbf7] tracking-tighter mb-6 bg-gradient-to-b from-[#fdfbf7] to-[#fdfbf7]/20 bg-clip-text text-transparent">
          404
        </h1>
        <p className="nf-text text-2xl font-serif text-orange-500 mb-4">Signal Lost</p>
        <p className="nf-text text-base text-white/50 max-w-md mx-auto mb-10 leading-relaxed">
          The research pathway you attempted to access doesn't exist in our active matrix.
        </p>
        
        <Link 
          to="/" 
          className="nf-btn inline-flex items-center gap-2 rounded-sm bg-[#fdfbf7] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] transition-all hover:bg-[#e0e0e0] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Matrix
        </Link>
        
        <div className="nf-text mt-16">
          <a
            href={brand.url}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 transition-colors hover:text-white/50"
          >
            {brand.operatedByLine}
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;