import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { brand } from "@/config/brand";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for testing the engine.",
    features: [
      "10 AI comparisons per month",
      "Standard execution speed",
      "Basic document research",
      "Public comparison links",
    ],
    buttonText: "Start for free",
    buttonVariant: "outline",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For professionals needing deeper research.",
    features: [
      "500 AI comparisons per month",
      "Highest execution speed",
      "Advanced file uploads (PDF, CSV)",
      "Private & team links",
      "No SideBy watermarks",
    ],
    buttonText: "Upgrade to Pro",
    buttonVariant: "primary",
    popular: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "/mo",
    description: "Collaborative research for teams.",
    features: [
      "Unlimited AI comparisons",
      "Shared team workspaces",
      "Centralized knowledge base",
      "Export to PDF / Markdown",
      "Priority support",
    ],
    buttonText: "Get Team",
    buttonVariant: "outline",
  },
];

const Pricing = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".pricing-header", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".pricing-card", { y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="min-h-screen bg-[#0c0b0a] text-[#fdfbf7] selection:bg-orange-500/30 pb-24">
      {/* Header */}
      <header className="absolute left-0 right-0 top-0 z-40 bg-transparent">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="flex h-10 w-10 items-center justify-center border border-[#333] bg-[#111] font-serif text-xl text-[#fdfbf7] transition-all group-hover:border-orange-500/50 group-hover:text-orange-400">
              S
            </div>
            <div>
              <p className="font-serif text-lg tracking-tight text-[#fdfbf7] transition-colors group-hover:text-orange-50">{brand.productName}</p>
            </div>
          </Link>
          <Link to="/auth/sign-in" className="text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      <div className="pricing-header pt-40 text-center px-6">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-[#fdfbf7] mb-6">
          Simple, usage-based pricing
        </h1>
        <p className="text-lg text-white/50 max-w-2xl mx-auto">
          Start for free, upgrade when you need deeper context limits, faster orchestration, and team collaboration features.
        </p>
      </div>

      <div className="mx-auto mt-20 max-w-7xl px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div 
              key={tier.name} 
              className={`pricing-card relative flex flex-col rounded-[2rem] border p-8 backdrop-blur-md transition-all ${
                tier.popular 
                  ? "border-orange-500/50 bg-[#1a110a] shadow-[0_0_40px_rgba(234,88,12,0.1)] scale-105 z-10" 
                  : "border-white/10 bg-[#111]/50 hover:border-white/20 hover:bg-[#111]"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-sm text-white/50 min-h-[40px]">{tier.description}</p>
              </div>

              <div className="mb-8">
                <span className="font-serif text-5xl text-white">{tier.price}</span>
                {tier.period && <span className="text-white/40">{tier.period}</span>}
              </div>

              <ul className="mb-8 flex-1 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tier.popular ? "text-orange-400" : "text-emerald-400"}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth/sign-up"
                className={`flex items-center justify-center gap-2 rounded-xl py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                  tier.buttonVariant === "primary"
                    ? "bg-white text-black hover:bg-[#e0e0e0]"
                    : "border border-white/20 bg-transparent text-white hover:bg-white/5 hover:border-white/40"
                }`}
              >
                {tier.buttonText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;