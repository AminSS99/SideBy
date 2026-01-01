export type ComparisonCategory = "travel" | "sports" | "education" | "tech" | "living";

export interface ComparisonItem {
  id: string;
  category: ComparisonCategory;
  name: string;
  subtext: string;
  image: string;
  metrics: Record<string, number>;
  highlights: string[];
}

export const mockDB: ComparisonItem[] = [
  // TRAVEL
  {
    id: "hamburg", category: "travel", name: "Hamburg", subtext: "Germany",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
    metrics: { budget: 85, accessibility: 92, culture: 88, safety: 90, climate: 70 },
    highlights: ["Maritime", "Techno", "Seafood"]
  },
  {
    id: "tokyo", category: "travel", name: "Tokyo", subtext: "Japan",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
    metrics: { budget: 60, accessibility: 98, culture: 95, safety: 98, climate: 80 },
    highlights: ["Cyberpunk", "Sushi", "Anime"]
  },
  // SPORTS
  {
    id: "real-madrid", category: "sports", name: "Real Madrid", subtext: "La Liga",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    metrics: { history: 99, squad: 98, fans: 99, form: 85, stadium: 95 },
    highlights: ["14 Champions Leagues", "Galacticos", "Royal"]
  },
  {
    id: "man-city", category: "sports", name: "Manchester City", subtext: "Premier League",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
    metrics: { history: 75, squad: 99, fans: 80, form: 98, stadium: 99 },
    highlights: ["Treble Winners", "Pep Guardiola", "Modern"]
  },
  // EDUCATION
  {
    id: "harvard", category: "education", name: "Harvard", subtext: "USA",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
    metrics: { research: 99, campus: 85, prestige: 99, network: 99, value: 40 },
    highlights: ["Ivy League", "Acceptance: 4%", "Legacy"]
  },
  {
    id: "oxford", category: "education", name: "Oxford", subtext: "UK",
    image: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&w=800&q=80",
    metrics: { research: 98, campus: 95, prestige: 99, network: 95, value: 60 },
    highlights: ["Ancient", "Collegiate System", "Global Elite"]
  },
  // LIVING
  {
    id: "austin", category: "living", name: "Austin", subtext: "Texas, USA",
    image: "https://images.unsplash.com/photo-1531210783285-cf8b9981358d?auto=format&fit=crop&w=800&q=80",
    metrics: { jobs: 92, rent: 75, commute: 65, fun: 95, nature: 80 },
    highlights: ["Tech Hub", "Live Music", "No State Tax"]
  },
  {
    id: "lisbon", category: "living", name: "Lisbon", subtext: "Portugal",
    image: "https://images.unsplash.com/photo-1517704130591-789958194bda?auto=format&fit=crop&w=800&q=80",
    metrics: { jobs: 60, rent: 90, commute: 85, fun: 88, nature: 92 },
    highlights: ["Digital Nomad Haven", "Sunny", "History"]
  }
];