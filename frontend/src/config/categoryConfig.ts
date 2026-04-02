/**
 * Category Configuration for Domain-Specific Comparisons
 * Each category has its own set of relevant metrics, tips, and insights
 */

export interface CategoryMetric {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  description: string;
}

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string;
  emoji: string;
  keywords: string[]; // Keywords to detect this category
  metrics: CategoryMetric[];
  tips: string[];
  bestForLabels: { itemA: string; itemB: string };
}

// ========== SPORTS CATEGORY ==========
export const sportsConfig: CategoryConfig = {
  id: "sports",
  label: "Sports",
  icon: "Trophy",
  emoji: "⚽",
  keywords: [
    "bayern", "munich", "psg", "barcelona", "real madrid", "manchester", "liverpool",
    "chelsea", "arsenal", "juventus", "inter", "milan", "dortmund", "atletico",
    "nba", "lakers", "celtics", "warriors", "bulls", "heat", "knicks",
    "nfl", "patriots", "cowboys", "packers", "chiefs", "eagles",
    "team", "club", "fc", "united", "city", "athletic", "sporting"
  ],
  metrics: [
    { id: "trophies", label: "Trophies Won", icon: "Trophy", description: "Total major titles" },
    { id: "squad_value", label: "Squad Value", icon: "DollarSign", description: "Total market value" },
    { id: "fan_base", label: "Fan Base", icon: "Users", description: "Global fanbase size" },
    { id: "stadium", label: "Stadium", icon: "Building", description: "Capacity and atmosphere" },
    { id: "history", label: "History", icon: "Clock", description: "Legacy and tradition" },
    { id: "youth_academy", label: "Youth Academy", icon: "GraduationCap", description: "Player development" },
    { id: "manager", label: "Manager", icon: "User", description: "Coaching quality" },
    { id: "recent_form", label: "Recent Form", icon: "TrendingUp", description: "Last season performance" },
    { id: "european_success", label: "European Success", icon: "Globe", description: "Champions League/Europa" },
    { id: "domestic_dominance", label: "Domestic Dominance", icon: "Award", description: "League titles" },
    { id: "star_players", label: "Star Players", icon: "Star", description: "Key talent" },
    { id: "finances", label: "Financial Power", icon: "Wallet", description: "Revenue and spending" },
  ],
  tips: [
    "Check recent Champions League and domestic league performance",
    "Consider the manager's tactical style and success rate",
    "Look at squad depth for long-term potential",
    "Youth academy output can indicate future sustainability",
    "Stadium atmosphere significantly impacts home advantage"
  ],
  bestForLabels: { itemA: "Die-hard supporters", itemB: "Glory hunters" }
};

// ========== TRAVEL CATEGORY ==========
export const travelConfig: CategoryConfig = {
  id: "travel",
  label: "Travel",
  icon: "Plane",
  emoji: "🌍",
  keywords: [
    "paris", "london", "tokyo", "new york", "rome", "barcelona", "amsterdam",
    "berlin", "dubai", "singapore", "bangkok", "sydney", "los angeles",
    "istanbul", "prague", "vienna", "budapest", "lisbon", "moscow", "beijing",
    // Additional cities and countries
    "baku", "azerbaijan", "venezuela", "caracas", "brazil", "rio", "mexico",
    "cairo", "egypt", "morocco", "marrakech", "athens", "greece", "spain",
    "madrid", "milan", "florence", "venice", "naples", "munich",
    "zurich", "geneva", "oslo", "stockholm", "copenhagen", "helsinki",
    "seoul", "taipei", "hong kong", "manila", "jakarta", "mumbai", "delhi",
    "city", "country", "destination", "vacation", "trip", "travel", "visit", "tourism"
  ],
  metrics: [
    { id: "cost_of_living", label: "Cost of Living", icon: "DollarSign", description: "Daily expenses" },
    { id: "safety", label: "Safety", icon: "Shield", description: "Crime rate and security" },
    { id: "weather", label: "Weather", icon: "Sun", description: "Climate and seasons" },
    { id: "culture", label: "Culture", icon: "Landmark", description: "Museums, art, history" },
    { id: "food_scene", label: "Food Scene", icon: "UtensilsCrossed", description: "Culinary experience" },
    { id: "nightlife", label: "Nightlife", icon: "Moon", description: "Bars, clubs, entertainment" },
    { id: "public_transport", label: "Public Transport", icon: "Train", description: "Getting around" },
    { id: "attractions", label: "Attractions", icon: "MapPin", description: "Tourist spots" },
    { id: "language", label: "Language", icon: "Languages", description: "English friendliness" },
    { id: "accommodation", label: "Accommodation", icon: "Hotel", description: "Hotels and Airbnb" },
    { id: "walkability", label: "Walkability", icon: "Footprints", description: "Exploring on foot" },
    { id: "shopping", label: "Shopping", icon: "ShoppingBag", description: "Markets and stores" },
  ],
  tips: [
    "Book accommodations at least 3 months in advance for peak season",
    "Use local transport apps for authentic navigation",
    "Try street food for budget-friendly authentic cuisine",
    "Visit major attractions early morning to avoid crowds",
    "Learn basic phrases in the local language"
  ],
  bestForLabels: { itemA: "History lovers", itemB: "Adventure seekers" }
};

// ========== TECH CATEGORY ==========
export const techConfig: CategoryConfig = {
  id: "tech",
  label: "Tech",
  icon: "Code",
  emoji: "💻",
  keywords: [
    "react", "vue", "angular", "svelte", "next", "nuxt", "node", "python",
    "javascript", "typescript", "rust", "go", "java", "kotlin", "swift",
    "aws", "azure", "gcp", "vercel", "netlify", "heroku", "docker",
    "framework", "library", "language", "programming", "coding", "software"
  ],
  metrics: [
    { id: "performance", label: "Performance", icon: "Zap", description: "Speed and efficiency" },
    { id: "learning_curve", label: "Learning Curve", icon: "GraduationCap", description: "Ease of learning" },
    { id: "community", label: "Community", icon: "Users", description: "Support and resources" },
    { id: "documentation", label: "Documentation", icon: "Book", description: "Guides and tutorials" },
    { id: "ecosystem", label: "Ecosystem", icon: "Boxes", description: "Plugins and libraries" },
    { id: "job_market", label: "Job Market", icon: "Briefcase", description: "Career opportunities" },
    { id: "scalability", label: "Scalability", icon: "Maximize", description: "Growth potential" },
    { id: "maintenance", label: "Maintenance", icon: "Wrench", description: "Long-term support" },
    { id: "developer_experience", label: "Developer Experience", icon: "Heart", description: "Joy of coding" },
    { id: "type_safety", label: "Type Safety", icon: "Shield", description: "Error prevention" },
    { id: "bundle_size", label: "Bundle Size", icon: "Package", description: "Output footprint" },
    { id: "testing", label: "Testing", icon: "TestTube", description: "Test tooling" },
  ],
  tips: [
    "Consider your team's existing experience with similar technologies",
    "Check GitHub stars and npm downloads for community health",
    "Review the release cycle and breaking changes history",
    "Evaluate TypeScript support for long-term maintainability",
    "Test both with a small prototype before committing"
  ],
  bestForLabels: { itemA: "Enterprise teams", itemB: "Startups and MVPs" }
};

// ========== GAMING CATEGORY ==========
export const gamingConfig: CategoryConfig = {
  id: "gaming",
  label: "Gaming",
  icon: "Gamepad2",
  emoji: "🎮",
  keywords: [
    "ps5", "playstation", "xbox", "nintendo", "switch", "pc gaming",
    "fortnite", "minecraft", "gta", "call of duty", "cod", "fifa", "nba2k",
    "zelda", "mario", "halo", "god of war", "spider-man", "elden ring",
    "game", "gaming", "console", "esports", "multiplayer", "rpg"
  ],
  metrics: [
    { id: "graphics", label: "Graphics", icon: "Monitor", description: "Visual quality" },
    { id: "gameplay", label: "Gameplay", icon: "Gamepad2", description: "Fun factor" },
    { id: "story", label: "Story", icon: "BookOpen", description: "Narrative quality" },
    { id: "multiplayer", label: "Multiplayer", icon: "Users", description: "Online experience" },
    { id: "exclusives", label: "Exclusives", icon: "Star", description: "Unique titles" },
    { id: "price", label: "Price", icon: "DollarSign", description: "Value for money" },
    { id: "player_base", label: "Player Base", icon: "Globe", description: "Active community" },
    { id: "updates", label: "Updates", icon: "RefreshCw", description: "Content support" },
    { id: "controls", label: "Controls", icon: "CircleDot", description: "Responsiveness" },
    { id: "replay_value", label: "Replay Value", icon: "Repeat", description: "Longevity" },
    { id: "esports", label: "Esports Scene", icon: "Trophy", description: "Competitive" },
    { id: "streaming", label: "Streaming", icon: "Video", description: "Watch appeal" },
  ],
  tips: [
    "Check if your friends play on the same platform",
    "Consider subscription services like Game Pass or PS Plus",
    "Look at upcoming exclusive titles for each platform",
    "Factor in controller preferences and comfort",
    "Research backward compatibility for your existing library"
  ],
  bestForLabels: { itemA: "Competitive players", itemB: "Casual gamers" }
};

// ========== FOOD CATEGORY ==========
export const foodConfig: CategoryConfig = {
  id: "food",
  label: "Food",
  icon: "UtensilsCrossed",
  emoji: "🍔",
  keywords: [
    // Fast food chains
    "mcdonald", "burger king", "wendy", "kfc", "pizza hut", "domino",
    "starbucks", "dunkin", "subway", "chipotle", "taco bell", "chick-fil-a",
    // Common food items
    "pizza", "burger", "sushi", "pasta", "tacos", "ramen", "steak", "salad",
    "sandwich", "wings", "fries", "noodles", "curry", "kebab", "shawarma",
    // General food terms
    "restaurant", "cafe", "food", "cuisine", "dining", "menu", "meal", "dish"
  ],
  metrics: [
    { id: "taste", label: "Taste", icon: "Heart", description: "Flavor quality" },
    { id: "price", label: "Price", icon: "DollarSign", description: "Value for money" },
    { id: "ambiance", label: "Ambiance", icon: "Sparkles", description: "Atmosphere" },
    { id: "service", label: "Service", icon: "UserCheck", description: "Staff quality" },
    { id: "location", label: "Location", icon: "MapPin", description: "Accessibility" },
    { id: "menu_variety", label: "Menu Variety", icon: "List", description: "Options" },
    { id: "portion_size", label: "Portion Size", icon: "Maximize", description: "Amount" },
    { id: "wait_time", label: "Wait Time", icon: "Clock", description: "Speed" },
    { id: "cleanliness", label: "Cleanliness", icon: "Sparkles", description: "Hygiene" },
    { id: "healthy_options", label: "Healthy Options", icon: "Leaf", description: "Nutrition" },
    { id: "delivery", label: "Delivery", icon: "Truck", description: "Convenience" },
    { id: "dietary_options", label: "Dietary Options", icon: "Utensils", description: "Vegan/GF" },
  ],
  tips: [
    "Check recent reviews on Google Maps and Yelp",
    "Visit during off-peak hours for better service",
    "Look for daily specials and happy hour deals",
    "Ask about dietary accommodations before ordering",
    "Consider delivery fees when comparing value"
  ],
  bestForLabels: { itemA: "Date nights", itemB: "Family meals" }
};

// ========== AUTO CATEGORY ==========
export const autoConfig: CategoryConfig = {
  id: "auto",
  label: "Auto",
  icon: "Car",
  emoji: "🚗",
  keywords: [
    "tesla", "bmw", "mercedes", "audi", "porsche", "toyota", "honda",
    "ford", "chevrolet", "volkswagen", "hyundai", "kia", "nissan", "mazda",
    "car", "vehicle", "suv", "sedan", "truck", "electric", "hybrid"
  ],
  metrics: [
    { id: "performance", label: "Performance", icon: "Gauge", description: "Speed and power" },
    { id: "fuel_economy", label: "Fuel Economy", icon: "Fuel", description: "MPG/range" },
    { id: "safety", label: "Safety", icon: "Shield", description: "Crash ratings" },
    { id: "comfort", label: "Comfort", icon: "Armchair", description: "Ride quality" },
    { id: "price", label: "Price", icon: "DollarSign", description: "Cost of ownership" },
    { id: "reliability", label: "Reliability", icon: "CheckCircle", description: "Dependability" },
    { id: "resale_value", label: "Resale Value", icon: "TrendingUp", description: "Depreciation" },
    { id: "features", label: "Features", icon: "Settings", description: "Tech and amenities" },
    { id: "interior", label: "Interior", icon: "Sofa", description: "Cabin quality" },
    { id: "cargo_space", label: "Cargo Space", icon: "Package", description: "Storage" },
    { id: "handling", label: "Handling", icon: "Navigation", description: "Driving feel" },
    { id: "brand", label: "Brand", icon: "Award", description: "Prestige" },
  ],
  tips: [
    "Always test drive both vehicles before deciding",
    "Consider total cost of ownership, not just sticker price",
    "Check insurance rates for both models",
    "Research common issues and recall history",
    "Factor in charging infrastructure for EVs"
  ],
  bestForLabels: { itemA: "Performance enthusiasts", itemB: "Practical commuters" }
};

// ========== APPS/SERVICES CATEGORY ==========
export const appsConfig: CategoryConfig = {
  id: "apps",
  label: "Apps",
  icon: "Smartphone",
  emoji: "📱",
  keywords: [
    "spotify", "apple music", "netflix", "disney", "hulu", "youtube",
    "uber", "lyft", "doordash", "ubereats", "grubhub", "instacart",
    "zoom", "slack", "teams", "notion", "trello", "asana", "figma",
    "app", "service", "platform", "subscription", "streaming"
  ],
  metrics: [
    { id: "features", label: "Features", icon: "Puzzle", description: "Functionality" },
    { id: "price", label: "Price", icon: "DollarSign", description: "Subscription cost" },
    { id: "ux", label: "User Experience", icon: "Smile", description: "Ease of use" },
    { id: "support", label: "Support", icon: "Headphones", description: "Customer help" },
    { id: "integrations", label: "Integrations", icon: "Link", description: "Connections" },
    { id: "security", label: "Security", icon: "Lock", description: "Data protection" },
    { id: "offline_mode", label: "Offline Mode", icon: "WifiOff", description: "No-internet access" },
    { id: "updates", label: "Updates", icon: "RefreshCw", description: "Feature releases" },
    { id: "cross_platform", label: "Cross-Platform", icon: "Layers", description: "Device support" },
    { id: "content_library", label: "Content Library", icon: "Library", description: "Selection" },
    { id: "ads", label: "Ad Experience", icon: "Ban", description: "Interruptions" },
    { id: "family_plan", label: "Family Plan", icon: "Users", description: "Multi-user" },
  ],
  tips: [
    "Check if a free trial is available before subscribing",
    "Compare family plan pricing for households",
    "Look for student or annual discounts",
    "Test offline features if you travel frequently",
    "Check which devices are supported in your household"
  ],
  bestForLabels: { itemA: "Power users", itemB: "Casual users" }
};

// ========== ALL CATEGORIES ==========
export const categoryConfigs: Record<string, CategoryConfig> = {
  sports: sportsConfig,
  travel: travelConfig,
  tech: techConfig,
  gaming: gamingConfig,
  food: foodConfig,
  auto: autoConfig,
  apps: appsConfig,
};

// ========== CATEGORY DETECTION ==========
export const detectCategory = (itemA: string, itemB: string): CategoryConfig => {
  const combined = `${itemA} ${itemB}`.toLowerCase();
  
  // Check each category for keyword matches
  for (const [_, config] of Object.entries(categoryConfigs)) {
    const matchCount = config.keywords.filter(keyword => 
      combined.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      return config;
    }
  }
  
  // Default to tech if no match
  return techConfig;
};

// ========== GET RANDOM TIP ==========
export const getRandomTip = (category: CategoryConfig): string => {
  return category.tips[Math.floor(Math.random() * category.tips.length)];
};

export default categoryConfigs;
