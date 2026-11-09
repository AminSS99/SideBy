import { Link } from "react-router-dom";
import { MarketingNav } from "@/components/brand/MarketingNav";
import { MarketingFooter } from "@/components/brand/MarketingFooter";
import { Banner } from "@/components/ui/release-banner";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Changelog() {
  usePageTitle("Changelog");
  return (
    <div className="min-h-screen bg-[#070605] text-white">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-14 sm:px-6 sm:pt-24">
        <h1 className="font-serif text-5xl text-[#fffaf1] sm:text-7xl">SideBy changelog</h1>
        <p className="mb-8 mt-4 text-white/70">Release notes for SideBy’s comparison workspace.</p>
        <Banner id="sideby-changelog-features-v1">
          See how source-backed comparisons work on the{' '}
          <Link to="/features" className="font-semibold text-orange-200 underline underline-offset-4">Features page</Link>.
        </Banner>
        <ChangelogTimeline entries={[]} />
      </main>
      <MarketingFooter />
    </div>
  );
}
