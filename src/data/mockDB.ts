export type ComparisonCategory = "tech" | "travel" | "sports" | "education" | "living" | "groceries" | "gaming" | "ai-tools" | "dev-tools" | "general";

export interface ComparisonItem {
  id: string;
  category: ComparisonCategory;
  name: string;
  subtext: string;
  image: string;
  metrics: Record<string, number>;
  highlights: string[];
  specs: Record<string, string>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    trending: 'up' | 'down' | 'stable';
  };
}

export const mockDB: ComparisonItem[] = [
  // TECH
  {
    id: "iphone-15-pro", category: "tech", name: "iPhone 15 Pro", subtext: "Apple",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    metrics: { camera: 98, performance: 99, battery: 85, display: 96, value: 60 },
    highlights: ["Titanium", "A17 Pro", "USB-C"],
    specs: { "Processor": "A17 Pro", "Display": "6.1\" OLED", "Camera": "48MP Main", "Weight": "187g" },
    sentiment: { positive: 88, neutral: 10, negative: 2, trending: 'up' }
  },
  {
    id: "s24-ultra", category: "tech", name: "Galaxy S24 Ultra", subtext: "Samsung",
    image: "https://images.unsplash.com/photo-1707248590680-77a8298782a2?auto=format&fit=crop&w=800&q=80",
    metrics: { camera: 99, performance: 97, battery: 92, display: 98, value: 75 },
    highlights: ["Galaxy AI", "200MP Lens", "S-Pen"],
    specs: { "Processor": "SD 8 Gen 3", "Display": "6.8\" AMOLED", "Camera": "200MP Main", "Weight": "232g" },
    sentiment: { positive: 82, neutral: 12, negative: 6, trending: 'stable' }
  },
  // GAMING
  {
    id: "elden-ring", category: "gaming", name: "Elden Ring", subtext: "FromSoftware",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    metrics: { gameplay: 99, graphics: 92, story: 95, difficulty: 98, replayability: 99 },
    highlights: ["Open World", "Hardcore", "GOTY"],
    specs: { "Genre": "RPG", "Developer": "FromSoft", "Hours": "100+", "Multiplayer": "Yes" },
    sentiment: { positive: 98, neutral: 1, negative: 1, trending: 'up' }
  },
  {
    id: "god-of-war", category: "gaming", name: "God of War: Ragnarök", subtext: "Sony Santa Monica",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    metrics: { gameplay: 95, graphics: 99, story: 98, difficulty: 75, replayability: 85 },
    highlights: ["Cinematic", "Action", "Narrative"],
    specs: { "Genre": "Action-Adv", "Developer": "Sony", "Hours": "40+", "Multiplayer": "No" },
    sentiment: { positive: 96, neutral: 3, negative: 1, trending: 'stable' }
  },
  // AI TOOLS
  {
    id: "chatgpt", category: "ai-tools", name: "ChatGPT-4o", subtext: "OpenAI",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    metrics: { reasoning: 98, speed: 95, creative: 92, coding: 90, price: 80 },
    highlights: ["Multimodal", "Fast", "Standard"],
    specs: { "Model": "GPT-4o", "Context": "128k", "Vision": "Yes", "Voice": "Native" },
    sentiment: { positive: 90, neutral: 8, negative: 2, trending: 'up' }
  },
  {
    id: "claude", category: "ai-tools", name: "Claude 3.5 Sonnet", subtext: "Anthropic",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    metrics: { reasoning: 99, speed: 92, creative: 95, coding: 99, price: 85 },
    highlights: ["Coding King", "Natural", "Safe"],
    specs: { "Model": "Sonnet 3.5", "Context": "200k", "Vision": "Yes", "Voice": "No" },
    sentiment: { positive: 95, neutral: 4, negative: 1, trending: 'up' }
  }
];

// GENERATOR FOR UNKNOWN ITEMS
// This simulates an AI backend by procedurally generating plausible data for any input
export const generateSyntheticItem = (name: string, category: ComparisonCategory = "general"): ComparisonItem => {
  const seed = name.length;
  
  // Deterministic-ish random generator based on name length
  const pseudoRandom = (offset: number) => {
    return 70 + ((seed * offset) % 29); 
  };

  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    category,
    name: name,
    subtext: "Neural Generated Profile",
    image: `https://images.unsplash.com/photo-${category === 'groceries' ? '1542838132-92c53300491e' : category === 'dev-tools' ? '1461749280624-a40bd68927a6' : '1550751827-4bd374c3f58b'}?auto=format&fit=crop&w=800&q=80`,
    metrics: {
      quality: pseudoRandom(2),
      value: pseudoRandom(3),
      popularity: pseudoRandom(4),
      innovation: pseudoRandom(5),
      reliability: pseudoRandom(6)
    },
    highlights: ["AI Analyzed", "Community Verified", "Trending"],
    specs: { "Source": "Global Index", "Confidence": "High", "Data Points": "1.2M", "Status": "Active" },
    sentiment: { 
      positive: pseudoRandom(7), 
      neutral: 100 - pseudoRandom(7) - 5, 
      negative: 5, 
      trending: 'stable' 
    }
  };
};