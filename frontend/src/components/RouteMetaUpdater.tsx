import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { brand } from "@/config/brand";

type PageMetadata = {
  title: string;
  description: string;
};

const publicPages: Record<string, PageMetadata> = {
  "/": {
    title: "SideBy AI | Source-Backed Comparison Tool",
    description:
      "Compare options with cited sources, scored criteria, and an auditable AI verdict.",
  },
  "/features": {
    title: "Features | SideBy",
    description:
      "Explore SideBy's source-backed research, evidence extraction, adaptive scoring, refreshes, and comparison sharing.",
  },
  "/pricing": {
    title: "Pricing | SideBy",
    description:
      "Compare SideBy plans for individuals, researchers, and teams.",
  },
  "/docs": {
    title: "Documentation | SideBy",
    description:
      "Learn how to research, score, verify, export, and share source-backed comparisons with SideBy.",
  },
  "/about": {
    title: "About | SideBy",
    description:
      "Learn how SideBy turns research into transparent, source-backed decisions.",
  },
  "/blog": {
    title: "Field Notes | SideBy",
    description:
      "Practical notes on comparison research, source quality, scoring, and auditable AI decisions.",
  },
  "/contact": {
    title: "Contact | SideBy",
    description:
      "Contact SideBy about product questions, beta access, support, privacy, or security.",
  },
  "/legal/privacy": {
    title: "Privacy Policy | SideBy",
    description: "Read the SideBy privacy policy.",
  },
  "/legal/terms": {
    title: "Terms of Service | SideBy",
    description: "Read the SideBy terms of service.",
  },
  "/legal/cookies": {
    title: "Cookie Policy | SideBy",
    description: "Learn how SideBy uses cookies and similar technologies.",
  },
  "/legal/refund": {
    title: "Refund Policy | SideBy",
    description: "Read the SideBy subscription refund policy.",
  },
  "/legal/security": {
    title: "Security | SideBy",
    description:
      "Review SideBy's identity, data, secrets, and browser security controls.",
  },
};

const setMeta = (
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

export function RouteMetaUpdater() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isComparison = pathname.startsWith("/compare/");
    const metadata = publicPages[pathname] ?? (isComparison
      ? {
          title: "Source-Backed Comparison | SideBy",
          description:
            "Review a public SideBy comparison with cited facts, scored criteria, and an auditable verdict.",
        }
      : undefined);
    const isIndexable = Boolean(metadata);
    const canonicalPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    const canonicalUrl = `${brand.url}${isIndexable ? canonicalPath : "/"}`;

    document.title = metadata?.title ?? "SideBy";
    setMeta(
      'meta[name="description"]',
      "name",
      "description",
      metadata?.description ?? "SideBy source-backed AI comparison workspace.",
    );
    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      isIndexable
        ? "index,follow,max-image-preview:large"
        : "noindex,nofollow,noarchive",
    );
    setMeta('meta[property="og:title"]', "property", "og:title", document.title);
    setMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      metadata?.description ?? "SideBy source-backed AI comparison workspace.",
    );
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", document.title);
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      metadata?.description ?? "SideBy source-backed AI comparison workspace.",
    );

    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [pathname]);

  return null;
}
