export const brand = {
  productName: "SideBy",
  productShortName: "SideBy",
  companyName: "SnapSolve Ink",
  url: "https://sideby.ink",
  domain: "sideby.ink",
  aiEngineName: "SideBy Research Engine",
  networkName: "SideBy network",
  tagline: "Research faster. Compare smarter.",
  operatedByLine: "Made by SnapSolve Ink",
} as const;

export const colors = {
  primary: "#ea580c",
  primaryHex: "#ea580c",
  secondary: "#0891b2",
  secondaryHex: "#0891b2",
  entityA: "#ea580c",
  entityAGradient: "from-orange-500 to-red-700",
  entityB: "#0891b2",
  entityBGradient: "from-cyan-500 to-blue-700",
  accent: "#fde68a",
  surface: "#0a0908",
  surfaceRaised: "#161412",
  border: "rgba(255,255,255,0.1)",
  borderHover: "rgba(255,255,255,0.2)",
} as const;

export const buildShareUrl = (slug: string) =>
  `${brand.url.replace(/\/+$/, "")}/compare/${slug.replace(/^\/+/, "")}`;
