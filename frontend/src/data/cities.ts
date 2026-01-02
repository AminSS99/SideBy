export interface Landmark {
  name: string;
  type: string;
  image: string;
}

export interface CityData {
  id: string;
  name: string;
  country: string;
  tagline: string;
  image: string;
  landmarks: Landmark[];
  metrics: {
    safety: number;
    socialSentiment: number;
    inclusivity: number;
    visaRequired: boolean;
    safetyDetails: string;
    cost: {
      hotels: number;
      food: number;
      flights: number;
    };
    climate: {
      temp: number[]; // Jan to Dec
      bestMonth: string;
    };
    connectivity: {
      transport: number;
      walkability: number;
      flights: number;
    };
    culture: {
      tags: string[];
      languageScore: number;
      cuisineType: string;
    };
    purpose: {
      leisure: number;
      business: number;
      romance: number;
    };
  };
}

export const cities: CityData[] = [
  {
    id: "hamburg",
    name: "Hamburg",
    country: "Germany",
    tagline: "The Gateway to the World",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
    landmarks: [
      { name: "Elbphilharmonie", type: "Architecture", image: "https://images.unsplash.com/photo-1549925245-c89658e23f03?auto=format&fit=crop&w=400&q=80" },
      { name: "Speicherstadt", type: "History", image: "https://images.unsplash.com/photo-1541692641319-981cc79ee10a?auto=format&fit=crop&w=400&q=80" }
    ],
    metrics: {
      safety: 88,
      socialSentiment: 82,
      inclusivity: 94,
      visaRequired: false,
      safetyDetails: "Low crime, excellent lighting",
      cost: { hotels: 120, food: 45, flights: 300 },
      climate: { temp: [2, 3, 7, 12, 16, 19, 21, 20, 16, 11, 6, 3], bestMonth: "June" },
      connectivity: { transport: 95, walkability: 90, flights: 85 },
      culture: { tags: ["Maritime", "Techno", "Cidre"], languageScore: 92, cuisineType: "Seafood & Hearty" },
      purpose: { leisure: 80, business: 90, romance: 70 }
    }
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    tagline: "Neon Dreams & Timeless Tradition",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
    landmarks: [
      { name: "Shibuya Crossing", type: "Urban", image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=80" },
      { name: "Senso-ji Temple", type: "Spiritual", image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80" }
    ],
    metrics: {
      safety: 96,
      socialSentiment: 90,
      inclusivity: 85,
      visaRequired: true,
      safetyDetails: "Extremely safe, 24/7 patrol",
      cost: { hotels: 180, food: 60, flights: 900 },
      climate: { temp: [6, 7, 10, 15, 19, 22, 26, 28, 24, 18, 13, 8], bestMonth: "April" },
      connectivity: { transport: 99, walkability: 92, flights: 95 },
      culture: { tags: ["Cyberpunk", "Sushi", "Anime"], languageScore: 65, cuisineType: "Japanese Fusion" },
      purpose: { leisure: 95, business: 95, romance: 75 }
    }
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    tagline: "Modernist Marvels & Mediterranean Soul",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
    landmarks: [
      { name: "Sagrada Família", type: "Gothic", image: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=400&q=80" },
      { name: "Park Güell", type: "Art", image: "https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=400&q=80" }
    ],
    metrics: {
      safety: 72,
      socialSentiment: 88,
      inclusivity: 96,
      visaRequired: false,
      safetyDetails: "Mind your pockets in crowds",
      cost: { hotels: 140, food: 40, flights: 250 },
      climate: { temp: [12, 13, 15, 17, 20, 24, 27, 28, 25, 21, 16, 13], bestMonth: "September" },
      connectivity: { transport: 88, walkability: 95, flights: 90 },
      culture: { tags: ["Gothic", "Tapas", "Beach"], languageScore: 85, cuisineType: "Mediterranean Tapas" },
      purpose: { leisure: 90, business: 70, romance: 95 }
    }
  }
];