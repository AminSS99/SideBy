import React from "react";
import { CreditCard, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const BillingPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
          Subscription
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">
          Billing & Plans
        </h1>
        <p className="mt-4 max-w-3xl text-white/60">
          Manage your SideBy subscription, view invoice history, and update payment methods.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
          {/* Current Plan */}
          <div className="rounded-[28px] border border-orange-500/30 bg-gradient-to-br from-[#1a110a] to-black/30 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <CreditCard className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-6">
                Active Plan
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Free Beta</h2>
              <p className="text-white/60 mb-8 max-w-md">
                You are currently on the free beta tier. Upgrade to unlock more AI runs and team features.
              </p>

              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-white">Monthly AI Credits</span>
                  <span className="text-white/60">85 / 100</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-orange-500 w-[85%] rounded-full" />
                </div>
                <p className="mt-2 text-xs text-amber-400">You're approaching your monthly limit.</p>
              </div>

              <div className="flex gap-4">
                <button className="rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black hover:bg-[#e0e0e0] transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="rounded-[28px] border border-white/10 bg-black/30 p-8">
            <h3 className="text-xl font-bold text-white mb-6">Invoice History</h3>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/40">No invoices yet. You're on the free plan.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Pro Teaser */}
          <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Pro Plan Features</h3>
            <ul className="space-y-4">
              {['500 AI comparisons', 'Advanced document indexing', 'No watermarks', 'Priority execution'].map(feature => (
                <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/pricing" className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors">
              View all plans <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;