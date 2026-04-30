import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Network, Database, Lock, Zap, FileSearch, TerminalSquare } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { brand } from "@/config/brand";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { GlowCard } from "@/components/GlowCard";

const Features = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".feat-header", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".feat-card", { y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: pageRef });

  const features = [
    {
      icon: FileSearch,
      title: "Automated Fact Extraction",
      description: "Our engine crawls official documentation, pricing pages, and GitHub repos to extract raw, unbiased facts without marketing fluff.",
      color: "text-orange-500"
    },
    {
      icon: Network,
      title: "Multi-Model Orchestration",
      description: "We don't rely on one LLM. SideBy dynamically routes tasks to the best model—using DeepSeek for extraction and Gemini for synthesis.",
      color: "text-blue-500"
    },
    {
      icon: Database,
      title: "Private Knowledge Base",
      description: "Upload your own PDFs, CSVs, and internal architecture docs. We index them to ground your research in your specific context.",
      color: "text-emerald-500"
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "SOC2 compliant infrastructure. Your uploaded documents and private comparison runs are isolated and never used to train our base models.",
      color: "text-purple-500"
    },
    {
      icon: TerminalSquare,
      title: "Custom Prompt Library",
      description: "Define exactly how you want your research presented. Create templates that force the AI to use specific tone or formatting.",
      color: "text-cyan-500"
    },
    {
      icon: Zap,
      title: "Instant Refresh",
      description: "Pricing and features change constantly. With one click, SideBy recrawls the sources and highlights exactly what changed since your last run.",
      color: "text-amber-500"
    }
  ];

  return (
    <div ref={pageRef} className="min-h-screen bg-[#030303] text-[#fdfbf7] selection:bg-orange-500/30 flex flex-col">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <header className="relative z-40 bg-transparent pt-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#111] font-serif text-xl text-[#fdfbf7] transition-all group-hover:border-orange-500/50 group-hover:text-orange-400">
              S
            </div>
            <div>
              <p className="font-serif text-lg tracking-tight text-[#fdfbf7] transition-colors group-hover:text-orange-50">{brand.productName}</p>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/app" className="rounded-sm border border-[#333] bg-[#0c0b0a] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#1a1a1a]">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8 pt-24 pb-32">
        <div className="feat-header text-center max-w-3xl mx-auto mb-20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-4">
            Platform Capabilities
          </p>
          <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-[#fdfbf7] leading-[1.1] mb-6">
            Everything you need for technical research.
          </h1>
          <p className="text-lg text-white/50 leading-relaxed">
            SideBy combines intelligent web scraping with multi-model orchestration to deliver facts, not hallucinations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <GlowCard key={i} containerClassName="feat-card" className="p-8">
              <feature.icon className={`h-8 w-8 mb-6 ${feature.color}`} />
              <h3 className="font-serif text-2xl text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {feature.description}
              </p>
            </GlowCard>
          ))}
        </div>

        <div className="mt-24 rounded-sm border border-orange-500/30 bg-orange-500/10 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 blur-[80px] rounded-full pointer-events-none" />
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-6 relative z-10">Ready to stop digging through tabs?</h2>
          <Link to="/auth/sign-up" className="relative z-10 inline-block rounded-sm bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-gray-200">
            Start for free
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#080808] py-8 relative z-20">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between px-6 gap-4">
          <BrandFooter />
          <div className="flex gap-6">
            <Link to="/legal/privacy" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Privacy</Link>
            <Link to="/legal/terms" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;