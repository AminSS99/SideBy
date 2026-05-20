import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Target, Layers, Zap } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { brand } from "@/config/brand";
import { BrandFooter } from "@/components/brand/BrandFooter";

const About = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".about-header", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".about-content", { y: 40, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.4")
      .from(".value-card", { y: 30, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power2.out" }, "-=0.6");
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="min-h-screen bg-[#030303] text-[#fdfbf7] selection:bg-orange-500/30 flex flex-col">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 left-0 h-[500px] w-[500px] rounded-full bg-orange-600/[0.03] blur-[60px] -translate-x-1/2" />
      </div>

      <header className="relative z-40 bg-transparent pt-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-4 group">
            <img src="/sideby-logo.jpg" alt="SideBy" className="h-10 w-10 object-contain rounded-sm transition-all group-hover:opacity-80" />
            <div>
              <p className="font-serif text-lg tracking-tight text-[#fdfbf7] transition-colors group-hover:text-orange-50">{brand.productName}</p>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
              Contact
            </Link>
            <Link to="/app" className="rounded-sm border border-[#333] bg-[#0c0b0a] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#1a1a1a]">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8 pt-24 pb-32">
        <div className="about-header text-center max-w-4xl mx-auto mb-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            About SnapSolve Ink
          </div>
          <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-[#fdfbf7] leading-[1.1] mb-8">
            Built to find the signal in the noise.
          </h1>
          <p className="text-xl text-white/50 leading-relaxed mx-auto">
            We build orchestration engines that synthesize fragmented web data into clear, actionable intelligence. Our flagship product, SideBy, is designed to end the era of reading 40 tabs to make one engineering decision.
          </p>
        </div>

        <div className="about-content max-w-4xl mx-auto rounded-sm border border-[#2a2a2a] bg-[#111] p-10 md:p-16 mb-24 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/[0.03] to-transparent pointer-events-none" />
          <h2 className="font-serif text-3xl text-white mb-6">The Problem We're Solving</h2>
          <div className="space-y-6 text-lg text-white/70 font-light leading-relaxed">
            <p>
              The internet is flooded with SEO-optimized marketing pages, outdated Reddit threads, and biased vendor comparisons. When an engineering team needs to choose between two infrastructure providers, they spend days separating fact from marketing fiction.
            </p>
            <p>
              SnapSolve Ink was founded to fix this. We believe that large language models are best used not to generate new noise, but to synthesize and verify existing truth.
            </p>
            <p>
              SideBy uses a multi-model orchestration approach. We deploy one model to extract raw technical facts from official documentation, and a different model to synthesize those facts into a coherent, source-backed executive verdict.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="value-card rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-10">
            <Target className="h-8 w-8 text-orange-500 mb-6" />
            <h3 className="font-serif text-2xl text-white mb-4">Truth Over Scale</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              We prioritize the accuracy of our extractions over the speed of our output. If a fact cannot be traced back to an official source, it is marked with low confidence or excluded entirely.
            </p>
          </div>
          
          <div className="value-card rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-10">
            <Layers className="h-8 w-8 text-blue-500 mb-6" />
            <h3 className="font-serif text-2xl text-white mb-4">Orchestration</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              No single AI model is perfect at everything. We route tasks dynamically—using cheaper models for extraction and premium models for reasoning and synthesis.
            </p>
          </div>

          <div className="value-card rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-10">
            <Zap className="h-8 w-8 text-emerald-500 mb-6" />
            <h3 className="font-serif text-2xl text-white mb-4">Developer First</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Our tools are built for technical professionals who need inspectable primitives. Every comparison generated by SideBy exposes the exact sources and confidence scores used.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#080808] py-8 relative z-20">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between px-6 gap-4">
          <BrandFooter />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            &copy; {new Date().getFullYear()} SnapSolve Ink
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;