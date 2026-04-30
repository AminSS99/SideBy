import React, { useRef } from "react";
import { CreditCard, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const BillingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".bill-header", { y: -20, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".bill-card", { y: 20, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .from(".bill-sidebar", { x: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="bill-header">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Subscription
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#fdfbf7] tracking-tight">
          Billing & Plans
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#fdfbf7]/60">
          Manage your SideBy subscription, view invoice history, and update payment methods.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Current Plan */}
          <div className="bill-card rounded-sm border border-orange-500/30 bg-[#1a110a] p-8 md:p-10 relative overflow-hidden shadow-[0_0_40px_rgba(234,88,12,0.05)]">
            <div className="absolute -top-10 -right-10 p-8 opacity-5 pointer-events-none">
              <CreditCard className="w-64 h-64 text-orange-500" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-sm border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-orange-400 mb-8">
                Active Plan
              </div>
              <h2 className="font-serif text-4xl text-[#fdfbf7] mb-3">Free Beta</h2>
              <p className="text-sm text-[#fdfbf7]/60 mb-10 max-w-md leading-relaxed">
                You are currently on the free beta tier. Upgrade to unlock more AI runs and advanced team collaboration features.
              </p>

              <div className="mb-10 rounded-sm border border-[#333] bg-[#0c0b0a] p-6">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-4">
                  <span className="text-[#fdfbf7]/70">Monthly AI Credits</span>
                  <span className="text-orange-400">85 / 100</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#222] overflow-hidden">
                  <div className="h-full bg-orange-500 w-[85%] rounded-full shadow-[0_0_10px_#ea580c]" />
                </div>
                <p className="mt-4 text-xs text-[#fdfbf7]/40">You're approaching your monthly limit.</p>
              </div>

              <div className="flex gap-4">
                <button className="rounded-sm bg-[#fdfbf7] px-8 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a] hover:bg-[#e0e0e0] transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="bill-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <h3 className="mb-8 font-serif text-2xl text-[#fdfbf7] border-b border-[#2a2a2a] pb-6">Invoice History</h3>
            <div className="rounded-sm border border-dashed border-[#333] bg-[#0c0b0a] p-12 text-center">
              <p className="text-sm text-[#fdfbf7]/40">No invoices yet. You're on the free plan.</p>
            </div>
          </div>
        </div>

        <div className="bill-sidebar lg:col-span-4 space-y-6 sticky top-24">
          {/* Pro Teaser */}
          <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8">
            <h3 className="mb-6 font-serif text-xl text-[#fdfbf7] border-b border-[#2a2a2a] pb-4">Pro Plan Features</h3>
            <ul className="space-y-4">
              {['500 AI comparisons', 'Advanced document indexing', 'No watermarks', 'Priority execution', 'Export to PDF & Markdown'].map(feature => (
                <li key={feature} className="flex items-start gap-3 text-sm text-[#fdfbf7]/70 leading-relaxed">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/pricing" className="mt-8 inline-flex items-center justify-center w-full gap-2 rounded-sm border border-orange-500/30 bg-orange-500/10 py-3 text-[10px] font-bold uppercase tracking-widest text-orange-400 hover:bg-orange-500/20 transition-colors">
              View all plans <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;