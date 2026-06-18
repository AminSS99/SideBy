import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AmbientOrbs } from "@/components/AmbientOrbs";
import { analyzeQueryIntent } from "@/lib/queryIntent";
import { SUPPORTED_COMPARISON_CATEGORIES } from "@/lib/comparisonTaxonomy";
import { usePageTitle } from "@/hooks/usePageTitle";

// Extracted Components
import { Header } from "./index/components/Header";
import { Hero } from "./index/components/Hero";
import { Features } from "./index/components/Features";
import { Orchestration } from "./index/components/Orchestration";
import { Footer } from "./index/components/Footer";

gsap.registerPlugin(ScrollTrigger);

const featuredComparisons = SUPPORTED_COMPARISON_CATEGORIES.flatMap((category) =>
  category.examples.slice(0, 1).map((label) => ({
    label,
    category: category.shortLabel,
    sourceRequirement: category.sourceRequirements[0] || "Source-backed",
  })),
).slice(0, 9);

const quickStartComparisons = [
  "React vs Vue for a SaaS",
  "Supabase vs Firebase",
  "Cursor vs Windsurf",
  "Notion vs Linear",
  "ChatGPT Plus vs Claude Pro",
  "ETFs vs mutual funds",
];

const Index = () => {
  usePageTitle("AI-Powered Comparisons");
  const [query, setQuery] = useState("");
  const queryIntent = analyzeQueryIntent(query);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax Effect
  useEffect(() => {
    if (!heroRef.current) return;
    const hero = heroRef.current;

    const title = hero.querySelector(".parallax-title");
    const desc = hero.querySelector(".parallax-desc");
    if (!title || !desc) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const xToTitle = gsap.quickTo(title, "x", { duration: 0.8, ease: "power3" });
    const yToTitle = gsap.quickTo(title, "y", { duration: 0.8, ease: "power3" });

    const xToDesc = gsap.quickTo(desc, "x", { duration: 1, ease: "power3" });
    const yToDesc = gsap.quickTo(desc, "y", { duration: 1, ease: "power3" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      xToTitle(x * -20);
      yToTitle(y * -20);

      xToDesc(x * -10);
      yToDesc(y * -10);
    };

    const handleMouseLeave = () => {
      xToTitle(0); yToTitle(0);
      xToDesc(0); yToDesc(0);
    };

    hero.addEventListener("mousemove", handleMouseMove);
    hero.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      hero.removeEventListener("mousemove", handleMouseMove);
      hero.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(title);
      gsap.killTweensOf(desc);
    };
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".hero-badge, .parallax-title, .parallax-desc, .hero-search, .hero-featured, .starter-card, .feature-card, .orch-card", {
        clearProps: "all",
        opacity: 1,
      });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(".hero-badge, .parallax-title, .parallax-desc, .hero-search, .hero-featured", {
        willChange: "transform, opacity, filter",
      });
      gsap.set(".starter-card, .feature-card, .orch-card", {
        transformPerspective: 900,
        transformOrigin: "center",
        willChange: "transform, opacity, border-color",
      });

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero-badge", { y: 24, opacity: 0, filter: "blur(10px)", duration: 0.8 })
        .from(".parallax-title", { y: 44, opacity: 0, filter: "blur(14px)", duration: 1.15 }, "-=0.48")
        .from(".parallax-desc", { y: 24, opacity: 0, filter: "blur(8px)", duration: 0.82 }, "-=0.72")
        .from(".hero-search", { y: 28, opacity: 0, scale: 0.97, filter: "blur(10px)", duration: 0.9, ease: "back.out(1.25)" }, "-=0.5")
        .from(".hero-featured", { y: 16, opacity: 0, duration: 0.72 }, "-=0.5")
        .from(".quick-start-chip", { y: 16, opacity: 0, stagger: 0.045, duration: 0.48, ease: "power3.out" }, "-=0.5")
        .from(".starter-card", { y: 18, rotateX: -4, stagger: 0.045, duration: 0.55, ease: "power3.out" }, "-=0.25");

      gsap.to(".hero-search-shell", {
        boxShadow: "0 28px 80px rgba(234,88,12,0.18)",
        borderColor: "rgba(234,88,12,0.45)",
        duration: 1.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 82%",
          end: "bottom 55%",
          scrub: 0.6,
        },
        y: 58,
        opacity: 0,
        rotateX: -10,
        stagger: 0.14,
        ease: "none",
      });

      gsap.from(".feature-icon", {
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
        scale: 0.72,
        rotate: -8,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "back.out(1.7)",
      });

      gsap.from(".orchestration-heading > *", {
        scrollTrigger: {
          trigger: ".orchestration-section",
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
        y: 28,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: "power3.out",
      });

      gsap.from(".orch-card", {
        scrollTrigger: {
          trigger: ".orchestration-section",
          start: "top 66%",
          toggleActions: "play none none reverse",
        },
        y: 70,
        opacity: 0,
        rotateY: 10,
        stagger: 0.16,
        duration: 1,
        ease: "expo.out",
      });

      gsap.from(".orch-path", {
        scrollTrigger: {
          trigger: ".orchestration-section",
          start: "top 58%",
          end: "top 30%",
          scrub: 0.8,
        },
        scaleX: 0,
        opacity: 0,
        transformOrigin: "left",
        ease: "none",
      });

      const tiltCards = gsap.utils.toArray<HTMLElement>(".starter-card, .feature-card, .orch-card");
      const listeners = tiltCards.map((card) => {
        const rotateX = gsap.quickTo(card, "rotationX", { duration: 0.45, ease: "power3.out" });
        const rotateY = gsap.quickTo(card, "rotationY", { duration: 0.45, ease: "power3.out" });
        const y = gsap.quickTo(card, "y", { duration: 0.45, ease: "power3.out" });

        const move = (event: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const relX = (event.clientX - rect.left) / rect.width - 0.5;
          const relY = (event.clientY - rect.top) / rect.height - 0.5;
          rotateX(relY * -5);
          rotateY(relX * 7);
          y(-4);
        };
        const leave = () => {
          rotateX(0);
          rotateY(0);
          y(0);
        };

        card.addEventListener("mousemove", move);
        card.addEventListener("mouseleave", leave);
        return () => {
          card.removeEventListener("mousemove", move);
          card.removeEventListener("mouseleave", leave);
          gsap.killTweensOf(card);
        };
      });

      return () => {
        listeners.forEach((cleanup) => cleanup());
      };
    });

    return () => mm.revert();
  }, { scope: containerRef });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !queryIntent.canStart) return;
    navigate(`/app/comparisons?q=${encodeURIComponent(query.trim())}`);
  };

  const handleQuickStart = (q: string) => {
    navigate(`/app/comparisons?q=${encodeURIComponent(q)}`);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-white overflow-x-hidden selection:bg-orange-500/30 relative">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      
      <AmbientOrbs />

      <Header />

      <main className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 pt-24 sm:px-6 pb-24">
        <Hero
          heroRef={heroRef}
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
          queryIntent={queryIntent}
          quickStartComparisons={quickStartComparisons}
          handleQuickStart={handleQuickStart}
          featuredComparisons={featuredComparisons}
        />

        <Features />

        <Orchestration />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
