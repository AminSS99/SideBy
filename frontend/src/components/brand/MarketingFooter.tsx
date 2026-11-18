import { ArrowUpRight, Mail } from "@/components/icons";
import { Link } from "react-router-dom";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT, type MessageKey } from "@/i18n";

const footerGroups: { title: MessageKey; links: { label: MessageKey; to: string }[] }[] = [
  {
    title: "footer.product",
    links: [
      { label: "footer.features", to: "/features" },
      { label: "footer.changelog", to: "/changelog" },
      { label: "footer.pricing", to: "/pricing" },
      { label: "footer.docs", to: "/docs" },
      { label: "footer.ios", to: "/ios" },
      { label: "footer.research", to: "/blog" },
    ],
  },
  {
    title: "footer.company",
    links: [
      { label: "footer.about", to: "/about" },
      { label: "footer.contact", to: "/contact" },
      { label: "footer.security", to: "/legal/security" },
    ],
  },
  {
    title: "footer.legal",
    links: [
      { label: "footer.privacy", to: "/legal/privacy" },
      { label: "footer.terms", to: "/legal/terms" },
      { label: "footer.cookies", to: "/legal/cookies" },
      { label: "footer.refunds", to: "/legal/refund" },
    ],
  },
];

export function MarketingFooter() {
  const t = useT();
  return (
    <footer id="site-footer" className="relative z-10 overflow-hidden border-t border-white/[0.07] bg-[#050403]">
      <FooterBackgroundGradient />

      <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-6 sm:pt-16 md:pb-10 lg:pt-20">
        <div className="grid gap-12 border-b border-white/[0.08] pb-12 lg:grid-cols-[1.25fr_1fr] lg:gap-20 lg:pb-16">
          <div className="max-w-md">
            <Link to="/" aria-label={t("nav.homeAria")} className="inline-flex items-center gap-3 text-[#fffaf1]">
              <span className="relative h-9 w-9 shrink-0 overflow-hidden" aria-hidden="true">
                <img src="/sideby.ico?v=20260728-real" alt="" className="absolute -left-[30px] -top-[25px] h-24 w-24 max-w-none object-contain" />
              </span>
              <span className="font-serif text-2xl tracking-[-0.03em]">SideBy</span>
            </Link>
            <p className="mt-5 text-sm leading-6 text-white/65">
              {t("footer.tagline")}
            </p>
            <a
              href="mailto:snapsolvework@gmail.com"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.035] px-4 text-sm text-white/65 transition hover:border-orange-300/25 hover:text-white"
            >
              <Mail className="h-4 w-4 text-orange-300" />
              snapsolvework@gmail.com
            </a>
          </div>

          <nav aria-label={t("footer.nav")} className="grid grid-cols-2 gap-9 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">{t(group.title)}</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="group inline-flex min-h-11 items-center gap-1.5 text-sm text-white/65 transition hover:text-white">
                        {t(link.label)}
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-70" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 py-7 text-xs text-white/60 sm:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LanguageSwitcher variant="list" className="min-w-[13.5rem]" />
            <BrandFooter className="border-0 bg-transparent px-0 pr-0 shadow-none" />
          </div>
        </div>

        <div className="h-28 sm:h-40 lg:h-56">
          <TextHoverEffect text="SideBy" />
        </div>
      </div>
    </footer>
  );
}
