import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { brand } from "@/config/brand";
import { BrandFooter } from "@/components/brand/BrandFooter";

const blogPosts = [
  {
    id: "1",
    title: "The Death of 40-Tab Research: Why We Built SideBy",
    excerpt: "Engineering decisions require facts, not marketing fluff. We explain how our multi-model orchestration engine changes technical research.",
    date: "March 10, 2024",
    readTime: "5 min read",
    category: "Company",
    slug: "death-of-40-tab-research"
  },
  {
    id: "2",
    title: "Supabase vs Firebase in 2024: A Data-Driven Analysis",
    excerpt: "We unleashed the SideBy engine on the latest docs for both platforms. Here's what the extracted facts tell us about the current landscape.",
    date: "March 5, 2024",
    readTime: "8 min read",
    category: "Deep Dive",
    slug: "supabase-vs-firebase-2024"
  },
  {
    id: "3",
    title: "How to Evaluate LLM Providers for Enterprise SaaS",
    excerpt: "A framework for comparing AI models based on latency, cost, and factual grounding capabilities.",
    date: "February 28, 2024",
    readTime: "6 min read",
    category: "Engineering",
    slug: "evaluate-llm-providers"
  }
];

const Blog = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".blog-header", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".blog-post", { y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="min-h-screen bg-[#030303] text-[#fdfbf7] selection:bg-orange-500/30 flex flex-col">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <header className="relative z-40 bg-transparent pt-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-4 group">
            <img src="/sideby.ico" alt="SideBy" className="h-10 w-10 object-contain rounded-sm transition-all group-hover:opacity-80" />
            <div>
              <p className="font-serif text-lg tracking-tight text-[#fdfbf7] transition-colors group-hover:text-orange-50">{brand.productName}</p>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/app" className="rounded-sm border border-[#333] bg-[#0c0b0a] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#1a1a1a]">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8 pt-24 pb-32">
        <div className="blog-header mb-20 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-4">
            SnapSolve Ink Blog
          </p>
          <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-[#fdfbf7] leading-[1.1] mb-6">
            Engineering truths & orchestration insights.
          </h1>
          <p className="text-lg text-white/50 leading-relaxed">
            Thoughts on AI infrastructure, product comparisons, and building reliable orchestration engines.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.id} className="blog-post flex flex-col rounded-sm border border-[#2a2a2a] bg-[#111] transition-colors hover:border-[#444] group cursor-pointer">
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <span className="rounded-sm border border-[#333] bg-[#0c0b0a] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white/60">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </div>
                </div>
                
                <h2 className="font-serif text-2xl text-[#fdfbf7] mb-4 group-hover:text-orange-400 transition-colors">
                  {post.title}
                </h2>
                
                <p className="text-sm text-white/50 leading-relaxed mb-8 flex-1">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-6 mt-auto">
                  <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                    <Calendar className="h-3 w-3" />
                    {post.date}
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-orange-400 transition-colors transform group-hover:translate-x-1" />
                </div>
              </div>
            </article>
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

export default Blog;