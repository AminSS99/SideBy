import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { brand } from "@/config/brand";
import { BrandFooter } from "@/components/brand/BrandFooter";

const Contact = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".contact-header", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".contact-card", { y: 40, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.4")
      .from(".contact-form", { x: 30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");
  }, { scope: pageRef });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-[#030303] text-[#fdfbf7] selection:bg-orange-500/30 flex flex-col">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-orange-600/[0.04] blur-[60px] -translate-y-1/2 translate-x-1/3" />
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
            <Link to="/pricing" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/auth/sign-in" className="rounded-sm bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-gray-200">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8 pt-24 pb-32">
        <div className="contact-header mb-20 max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-4">
            Get in touch
          </p>
          <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-[#fdfbf7] leading-[1.1] mb-6">
            Contact our team.
          </h1>
          <p className="text-lg text-white/50 leading-relaxed">
            Whether you need enterprise orchestration limits, team onboarding, or have technical questions about our extraction engine, we're here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 items-start">
          <div className="space-y-6">
            <div className="contact-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 transition-colors hover:border-[#444]">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-6">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl text-white mb-2">Sales & Enterprise</h3>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">
                Need custom API limits, SLA guarantees, or private model routing? Let's build a plan for your team.
              </p>
              <a href="mailto:sales@snapsolve.ink" className="text-sm font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-2">
                sales@snapsolve.ink <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="contact-card rounded-sm border border-[#2a2a2a] bg-[#111] p-8 transition-colors hover:border-[#444]">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#1a1a1a] border border-[#333] text-white/60 mb-6">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl text-white mb-2">General Support</h3>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">
                Having trouble with a comparison run or billing? Our support team typically responds within 24 hours.
              </p>
              <a href="mailto:support@snapsolve.ink" className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors inline-flex items-center gap-2">
                support@snapsolve.ink <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="contact-form rounded-sm border border-[#2a2a2a] bg-[#0c0b0a] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            {isSubmitted ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center relative z-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-6">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-3xl text-white mb-4">Message received</h3>
                <p className="text-white/50 max-w-sm leading-relaxed mb-8">
                  Thanks for reaching out to SnapSolve Ink. We've received your message and will get back to you shortly.
                </p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <h3 className="font-serif text-2xl text-white mb-8 border-b border-[#2a2a2a] pb-6">Send a message</h3>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">First Name</label>
                    <input required type="text" className="w-full rounded-sm border border-[#333] bg-[#111] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Last Name</label>
                    <input required type="text" className="w-full rounded-sm border border-[#333] bg-[#111] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Work Email</label>
                  <input required type="email" className="w-full rounded-sm border border-[#333] bg-[#111] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">How can we help?</label>
                  <textarea required rows={5} className="w-full resize-none rounded-sm border border-[#333] bg-[#111] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500"></textarea>
                </div>

                <button type="submit" className="w-full rounded-sm bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-gray-200 mt-4">
                  Send Message
                </button>
              </form>
            )}
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

export default Contact;