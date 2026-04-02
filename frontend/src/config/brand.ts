export const brand = {
  productName: "SideBy",
  productShortName: "SideBy",
  companyName: "SnapSolve Ink",
  url: "https://snapsolve.ink",
  domain: "snapsolve.ink",
  aiEngineName: "SideBy AI Engine",
  networkName: "SideBy network",
  tagline: "Research faster. Compare smarter.",
  operatedByLine: "Made by SnapSolve Ink",
} as const;

export const buildShareUrl = (slug: string) =>
  `${brand.url.replace(/\/+$/, "")}/${slug.replace(/^\/+/, "")}`;
