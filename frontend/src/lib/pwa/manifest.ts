/**
 * Single source of truth for the SideBy web app manifest.
 * Consumed by vite.config.ts (vite-plugin-pwa), validated by tests, and
 * mirrored into index.html meta tags where applicable.
 */

export type ManifestIconPurpose = "any" | "maskable";

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: ManifestIconPurpose;
}

export interface SideByWebAppManifest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: "standalone";
  orientation?: "any" | "natural" | "portrait" | "landscape";
  background_color: string;
  theme_color: string;
  lang: string;
  dir: "ltr";
  categories: string[];
  icons: ManifestIcon[];
  shortcuts: Array<{
    name: string;
    short_name: string;
    url: string;
    icons?: ManifestIcon[];
  }>;
}

const BRAND_BACKGROUND = "#030303";
const BRAND_THEME = "#030303";

export const sideByManifest: SideByWebAppManifest = {
  id: "/",
  name: "SideBy Comparison Engine",
  short_name: "SideBy",
  description:
    "Source-backed AI comparisons with cited evidence, scored criteria, and auditable verdicts.",
  start_url: "/app",
  scope: "/",
  display: "standalone",
  orientation: "any",
  background_color: BRAND_BACKGROUND,
  theme_color: BRAND_THEME,
  lang: "en",
  dir: "ltr",
  categories: ["productivity", "business", "research"],
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon-maskable-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
  shortcuts: [
    {
      name: "New comparison",
      short_name: "Research",
      url: "/app/research",
      icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }],
    },
    {
      name: "Comparison library",
      short_name: "Library",
      url: "/app/comparisons",
      icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }],
    },
  ],
};
