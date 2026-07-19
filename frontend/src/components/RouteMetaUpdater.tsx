import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures that every page has a correct, self-referencing canonical URL
 * and Open Graph URL, which is vital for SEO to prevent duplicate content
 * issues and ensure correct social sharing links.
 */
export function RouteMetaUpdater() {
  const location = useLocation();

  useEffect(() => {
    // Construct the absolute URL.
    // In production, window.location.origin is typically https://sideby.ink
    const absoluteUrl = `${window.location.origin}${location.pathname}`;

    // 1. Update or create <link rel="canonical">
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", absoluteUrl);

    // 2. Update or create <meta property="og:url">
    let ogUrlMeta = document.querySelector('meta[property="og:url"]');
    if (!ogUrlMeta) {
      ogUrlMeta = document.createElement("meta");
      ogUrlMeta.setAttribute("property", "og:url");
      document.head.appendChild(ogUrlMeta);
    }
    ogUrlMeta.setAttribute("content", absoluteUrl);
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
}
