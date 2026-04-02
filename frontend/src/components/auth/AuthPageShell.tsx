import React from "react";
import { Link } from "react-router-dom";
import { brand } from "@/config/brand";

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerLabel: string;
  footerLinkLabel: string;
  footerHref: string;
}

const AuthPageShell = ({
  eyebrow,
  title,
  description,
  children,
  footerLabel,
  footerLinkLabel,
  footerHref,
}: AuthPageShellProps) => {
  return (
    <div className="min-h-screen bg-[#020202] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_-100px,rgba(168,85,247,0.16),transparent)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-3 self-start text-white/85 transition-colors hover:text-white"
        >
          <img
            src="/sideby-logo.jpg"
            alt={brand.productName}
            className="h-10 w-10 rounded-xl shadow-lg shadow-purple-600/20"
          />
          <div>
            <span className="block text-xl font-black tracking-tight">{brand.productName}</span>
            <span className="block text-[10px] uppercase tracking-[0.35em] text-white/35">
              Operated by {brand.companyName}
            </span>
          </div>
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
              {eyebrow}
            </p>
            <h1 className="max-w-xl text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
              {title}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-white/60">
              {description}
            </p>
            <a
              href={brand.url}
              className="inline-block text-sm text-white/35 transition-colors hover:text-white/70"
            >
              {brand.operatedByLine}
            </a>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            {children}
            <p className="mt-6 text-sm text-white/45">
              {footerLabel}{" "}
              <Link to={footerHref} className="text-white transition-colors hover:text-emerald-300">
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPageShell;
