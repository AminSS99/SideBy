import React from "react";
import { Link } from "react-router-dom";
import { BrandFooter } from "@/components/brand/BrandFooter";

export const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-[#2a2a2a] bg-[#080808] pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 md:grid-cols-4 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/sideby.ico" alt="SideBy" className="h-7 w-7 object-contain rounded-sm" />
              <span className="font-serif text-lg tracking-tight text-[#fdfbf7]">SideBy</span>
            </div>
            <p className="text-sm text-white/40 max-w-sm leading-relaxed mb-6">
              The source-backed AI comparison engine. Every claim is linked to a primary source so you can verify the information and trust the output.
            </p>
            <BrandFooter />
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link to="/features" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Features</Link></li>
              <li><Link to="/docs" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Documentation</Link></li>
              <li><Link to="/app" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Workbench</Link></li>
              <li><Link to="/pricing" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-white/40 hover:text-orange-400 transition-colors">About SnapSolve Ink</Link></li>
              <li><Link to="/blog" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Contact Sales</Link></li>
              <li><Link to="/legal/privacy" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/terms" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/cookies" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Cookies Policy</Link></li>
              <li><Link to="/legal/refund" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Refund Policy</Link></li>
              <li><Link to="/legal/security" className="text-sm text-white/40 hover:text-orange-400 transition-colors">Security Overview</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2a2a2a] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} SnapSolve Ink. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/30 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
            </a>
            <a href="#" className="text-white/30 hover:text-white transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
