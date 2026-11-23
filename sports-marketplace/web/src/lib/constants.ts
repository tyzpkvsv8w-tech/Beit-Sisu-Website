export type Market = {
  code: string;
  name: string;
  short: string;
  flag: string;
  currency: string;
  live: boolean;
  cities: string[];
};

export const MARKETS: Record<string, Market> = {
  ae: { code: "ae", name: "United Arab Emirates", short: "UAE", flag: "🇦🇪", currency: "AED", live: true,
    cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Al Ain"] },
  sa: { code: "sa", name: "Saudi Arabia", short: "KSA", flag: "🇸🇦", currency: "SAR", live: false, cities: ["Riyadh", "Jeddah", "Dammam"] },
  qa: { code: "qa", name: "Qatar", short: "Qatar", flag: "🇶🇦", currency: "QAR", live: false, cities: ["Doha", "Al Wakrah"] },
  om: { code: "om", name: "Oman", short: "Oman", flag: "🇴🇲", currency: "OMR", live: false, cities: ["Muscat", "Salalah"] },
  bh: { code: "bh", name: "Bahrain", short: "Bahrain", flag: "🇧🇭", currency: "BHD", live: false, cities: ["Manama"] },
  kw: { code: "kw", name: "Kuwait", short: "Kuwait", flag: "🇰🇼", currency: "KWD", live: false, cities: ["Kuwait City"] },
};

// Only the UAE is live today. When a second market launches, read this from a cookie or subdomain.
export const DEFAULT_MARKET = "ae";
export const market = (code = DEFAULT_MARKET) => MARKETS[code] ?? MARKETS[DEFAULT_MARKET];

export type Sport = { id: string; em: string; color: string };

export const SPORTS: Sport[] = [
  { id: "padel-tennis", em: "🎾", color: "#c9e86b" },
  { id: "cycling", em: "🚴", color: "#7fb3ff" },
  { id: "gym", em: "🏋️", color: "#ffb27a" },
  { id: "football", em: "⚽", color: "#8fe0a8" },
  { id: "golf", em: "⛳", color: "#a8e6c8" },
  { id: "water", em: "🏄", color: "#7fd8f0" },
  { id: "running", em: "👟", color: "#ff9aa8" },
  { id: "cricket", em: "🏏", color: "#f2d27a" },
  { id: "basketball", em: "🏀", color: "#ffbf80" },
  { id: "combat", em: "🥊", color: "#ff9b8f" },
  { id: "snow", em: "🎿", color: "#c8d8ff" },
  { id: "outdoor", em: "⛺", color: "#d6c49a" },
];

export const SPORT_BY_ID: Record<string, Sport> = Object.fromEntries(SPORTS.map((s) => [s.id, s]));
export const sportOf = (id: string) => SPORT_BY_ID[id] ?? SPORTS[0];

export const CONDITIONS = ["New with tags", "Like new", "Good", "Well used", "For parts"] as const;

export const REPORT_REASONS = [
  "Scam or fraud",
  "Prohibited or counterfeit item",
  "Wrong category",
  "Already sold",
  "Offensive content",
  "Abusive or scam messages",
  "Other",
] as const;

export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
