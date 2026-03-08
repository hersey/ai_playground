import { useQuery } from "@tanstack/react-query";
import { Baby, MapPin, ExternalLink } from "lucide-react";
import { Header } from "../components/Header";
import { EventCard } from "../components/EventCard";
import { LoadingSpinner, EmptyState } from "../components/LoadingSpinner";
import { api } from "../services/api";
import { CategoryFilter } from "../components/CategoryFilter";
import { useState } from "react";
import type { EventCategory } from "../types";

const TODDLER_CATEGORIES: EventCategory[] = ["toddler", "outdoor", "cultural", "community", "music"];

const PERMANENT_VENUES = [
  {
    name: "Brooklyn Children's Museum",
    desc: "World's oldest children's museum — interactive exhibits for ages 0-8. Play & Explore sessions for toddlers.",
    address: "145 Brooklyn Ave, Brooklyn",
    price: "$13",
    url: "https://brooklynkids.org",
    emoji: "🏛️",
  },
  {
    name: "Kidville",
    desc: "NYC's premier kids gym & classes. Open Play, music classes, and art for ages newborn to 6.",
    address: "Multiple NYC locations",
    price: "$25/class",
    url: "https://kidville.com",
    emoji: "🎠",
  },
  {
    name: "Central Park Playground Loop",
    desc: "21 incredible free playgrounds from the Safari to the Ancient Playground. Best in Manhattan for toddlers.",
    address: "Central Park (various)",
    price: "Free",
    url: "https://centralparknyc.org",
    emoji: "🌳",
  },
  {
    name: "Imagination Playground",
    desc: "Award-winning adventure playground with giant blue foam blocks. Toddler heaven in lower Manhattan.",
    address: "Burling Slip, Lower Manhattan",
    price: "Free",
    url: "https://imaginationplayground.com",
    emoji: "🧱",
  },
  {
    name: "Chelsea Piers Kids Club",
    desc: "Gymnastics, sports, and movement classes for toddlers. NYC's most complete sports center for kids.",
    address: "Pier 62, Chelsea",
    price: "$30+/class",
    url: "https://chelseapiers.com/kids",
    emoji: "⚽",
  },
  {
    name: "The Little Gym NYC",
    desc: "Motor skills, confidence, and fun through gymnastics and dance. Classes for 4 months through 12 years.",
    address: "Multiple NYC locations",
    price: "$30/class",
    url: "https://thelittlegym.com",
    emoji: "🤸",
  },
];

export function ToddlerPage() {
  const [activeFilters, setActiveFilters] = useState<EventCategory[]>(["toddler"]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["events-toddler", activeFilters],
    queryFn: api.events.toddler,
    staleTime: 10 * 60 * 1000,
  });

  const events = data?.data ?? [];
  const filteredEvents =
    activeFilters.length === 0 || activeFilters.includes("toddler")
      ? events
      : events.filter((e) => activeFilters.some((f) => e.categories.includes(f)));

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title="🧒 Little Explorers"
        subtitle="NYC with your toddler"
        showNotificationBell={false}
      />

      <div className="flex-1 px-4 pt-4 max-w-lg mx-auto w-full">
        {/* Hero tip */}
        <div className="mb-4 p-4 bg-gradient-to-r from-green-900/40 to-teal-900/40 border border-green-800/30 rounded-2xl">
          <p className="text-sm text-green-300 font-medium">
            🌟 NYC is one of the best cities for toddlers — free museums, incredible playgrounds, and endless story times!
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilter
            selected={activeFilters}
            onChange={setActiveFilters}
            options={TODDLER_CATEGORIES}
          />
        </div>

        {/* Events */}
        {isLoading && <LoadingSpinner message="Finding toddler-friendly events..." />}

        {error && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl text-xs text-yellow-400">
            Showing offline events — start the backend for live data.
          </div>
        )}

        {!isLoading && (
          <section className="mb-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              This Week's Events
            </h2>
            {filteredEvents.length === 0 ? (
              <EmptyState
                emoji="🎪"
                title="No toddler events found"
                body="Check back later! NYC has tons of family programming that refreshes weekly."
              />
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Permanent Venues */}
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Baby size={12} />
            Top Toddler Venues
          </h2>
          <div className="space-y-3">
            {PERMANENT_VENUES.map((venue) => (
              <a
                key={venue.name}
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="event-card flex gap-3 p-3.5 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl hover:border-[#3a3a6a] transition-colors"
              >
                <span className="text-3xl shrink-0">{venue.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold truncate">{venue.name}</h3>
                    <ExternalLink size={12} className="text-gray-600 shrink-0" />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{venue.desc}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <MapPin size={9} />
                      {venue.address}
                    </div>
                    <span className={`text-xs font-bold ${venue.price === "Free" ? "text-[#06d6a0]" : "text-[#e63946]"}`}>
                      {venue.price}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Tips */}
        <div className="mt-6 p-4 bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl">
          <h3 className="text-xs font-bold text-gray-300 mb-2">💡 Parent Tips</h3>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li>• Brooklyn Public Library has free storytime every week — no registration needed</li>
            <li>• The Met is "pay what you wish" for NYC residents with kids</li>
            <li>• NYC Parks has free summer programming at 1,700+ parks</li>
            <li>• Most NYC museums have free/reduced days — check their websites</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
