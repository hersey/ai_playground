export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  venue: string;
  address: string;
  neighborhood?: string;
  price: string;
  priceMin?: number;
  priceMax?: number;
  url: string;
  imageUrl?: string;
  categories: EventCategory[];
  tags: string[];
  source: string;
  isFeatured?: boolean;
  isToddlerFriendly?: boolean;
  isFilmRelated?: boolean;
  aiSummary?: string;
}

export type EventCategory =
  | "broadway" | "comedy" | "theater" | "art" | "music"
  | "food" | "film" | "toddler" | "outdoor" | "cultural"
  | "community" | "networking" | "sports" | "festival"
  | "gallery" | "screening" | "meetup" | "volunteer";

export interface ShowTicket {
  id: string;
  showName: string;
  host: string;
  network: string;
  description: string;
  lotteryUrl: string;
  ticketingPlatform: string;
  isLotteryOpen: boolean;
  lotteryOpensAt?: string;
  lotteryClosesAt?: string;
  tapeDate?: string;
  lastChecked: string;
  howToApply: string;
}

export interface UserPreferences {
  interests: EventCategory[];
  neighborhoods: string[];
  maxPrice: number | null;
  toddlerMode: boolean;
  filmMode: boolean;
  notificationsEnabled: boolean;
  showLotteryAlerts: string[];
}

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; emoji: string; color: string }> = {
  broadway: { label: "Broadway", emoji: "🎭", color: "bg-purple-600" },
  comedy: { label: "Comedy", emoji: "😂", color: "bg-yellow-600" },
  theater: { label: "Theater", emoji: "🎬", color: "bg-purple-700" },
  art: { label: "Art", emoji: "🎨", color: "bg-pink-600" },
  music: { label: "Music", emoji: "🎵", color: "bg-blue-600" },
  food: { label: "Food", emoji: "🍕", color: "bg-orange-600" },
  film: { label: "Film", emoji: "🎥", color: "bg-red-600" },
  toddler: { label: "Kids", emoji: "🧒", color: "bg-green-600" },
  outdoor: { label: "Outdoor", emoji: "🌳", color: "bg-emerald-600" },
  cultural: { label: "Cultural", emoji: "🌍", color: "bg-teal-600" },
  community: { label: "Community", emoji: "🤝", color: "bg-cyan-600" },
  networking: { label: "Networking", emoji: "💼", color: "bg-gray-600" },
  sports: { label: "Sports", emoji: "⚽", color: "bg-green-700" },
  festival: { label: "Festival", emoji: "🎪", color: "bg-amber-600" },
  gallery: { label: "Gallery", emoji: "🖼️", color: "bg-rose-600" },
  screening: { label: "Screening", emoji: "📽️", color: "bg-red-700" },
  meetup: { label: "Meetup", emoji: "👥", color: "bg-indigo-600" },
  volunteer: { label: "Volunteer", emoji: "🙋", color: "bg-lime-600" },
};
