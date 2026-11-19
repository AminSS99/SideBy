import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { MarketingFooter } from "@/components/brand/MarketingFooter";
import { Banner } from "@/components/ui/release-banner";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useT } from "@/i18n";

const withParts = (template: string, parts: Record<string, ReactNode>) =>
  template.split(/(\{\w+\})/).map((piece, index) => {
    const match = /^\{(\w+)\}$/.exec(piece);
    return match && match[1] in parts ? <Fragment key={index}>{parts[match[1]]}</Fragment> : piece;
  });

export default function Changelog() {
  const t = useT();
  usePageTitle(t("mkt.changelog.pageTitle"));
  return (
    <div className="min-h-screen bg-[#070605] text-white">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-14 sm:px-6 sm:pt-24">
        <h1 className="font-serif text-5xl text-[#fffaf1] sm:text-7xl">{t("mkt.changelog.title")}</h1>
        <p className="mb-8 mt-4 text-white/70">{t("mkt.changelog.subtitle")}</p>
        <Banner id="sideby-changelog-features-v1">
          {withParts(t("mkt.changelog.banner"), {
            featuresLink: (
              <Link to="/features" className="font-semibold text-orange-200 underline underline-offset-4">
                {t("mkt.changelog.featuresLink")}
              </Link>
            ),
          })}
        </Banner>
        <ChangelogTimeline entries={[]} />
      </main>
      <MarketingFooter />
    </div>
  );
}
