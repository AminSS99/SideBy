import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Book, Code, Key, Zap, Layers, FileSearch, Search, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { BrandFooter } from "@/components/brand/BrandFooter";

const docCategories = [
  {
    icon: Zap,
    title: "Quickstart",
    description: "Get up and running with SideBy in your workspace in under 5 minutes.",
    links: ["Creating an account", "Running your first comparison", "Understanding category badges"]
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Integrate the SideBy extraction and orchestration engine directly into your app.",
    links: ["Authentication", "POST /api/comparisons", "GET /api/comparisons/taxonomy"]
  },
  {
    icon: ShieldCheck,
    title: "Comparison Taxonomy",
    description: "Supported categories, source requirements, safety policy, and result templates.",
    links: ["Supported categories", "Blocked comparisons", "Category-specific dimensions"]
  },
  {
    icon: Layers,
    title: "Workspaces & Teams",
    description: "Manage roles, billing, and collaborative features.",
    links: ["Inviting team members", "Role permissions", "Managing projects"]
  },
  {
    icon: FileSearch,
    title: "Knowledge Base (RAG)",
    description: "Ground the AI in your own uploaded context.",
    links: ["Supported file types", "Managing uploads", "Citation mechanics"]
  },
  {
    icon: Book,
    title: "Prompt Studio",
    description: "Force the AI to output specific formats or tones.",
    links: ["Creating templates", "Using variables", "Testing prompts"]
  },
  {
    icon: Key,
    title: "Security & Trust",
    description: "How we handle data privacy and model training.",
    links: ["Data isolation", "LLM zero-retention policies", "SOC2 details"]
  }
];

const Docs = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".docs-header", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".docs-search", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" }, "-=0.4")
      .from(".docs-card", { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power2.out" }, "-=0.4");
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="min-h-screen bg-[#030303] text-[#fdfbf7] selection:bg-orange-500/30 flex flex-col">
      <header className="relative z-40 border-b border-[#2a2a2a] bg-[#030303] pt-4 pb-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-4 group">
            <img src="/sideby.ico" alt="SideBy" className="h-8 w-8 object-contain rounded-sm transition-all group-hover:opacity-80" />
            <div className="flex items-center gap-2">
              <span className="font-serif tracking-tight text-[#fdfbf7] group-hover:text-orange-50 transition-colors">{brand.productName}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 border-l border-[#333] pl-2">Documentation</span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/app" className="text-xs font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors">
              Go to App &rarr;
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8 pt-16 pb-32">
        <div className="docs-header text-center max-w-3xl mx-auto mb-12">
          <h1 className="font-serif text-5xl tracking-tight text-[#fdfbf7] mb-6">
            How can we help?
          </h1>
          <p className="text-lg text-white/50 leading-relaxed">
            Learn how to use the SideBy engine, integrate our API, and configure your workspace.
          </p>
        </div>

        <div className="docs-search max-w-2xl mx-auto mb-20 relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="w-full h-14 rounded-sm border border-[#333] bg-[#111] pl-12 pr-4 text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docCategories.map((category, i) => (
            <div key={i} className="docs-card rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-8 hover:border-[#444] transition-colors group">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-[#111] border border-[#333] text-white group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
                <category.icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl text-white mb-3">{category.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                {category.description}
              </p>
              <ul className="space-y-3">
                {category.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="text-sm text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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

export default Docs;
