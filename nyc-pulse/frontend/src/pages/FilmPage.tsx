import { useQuery } from "@tanstack/react-query";
import { Film, Users, ExternalLink, Clapperboard } from "lucide-react";
import { Header } from "../components/Header";
import { EventCard } from "../components/EventCard";
import { LoadingSpinner, EmptyState } from "../components/LoadingSpinner";
import { api } from "../services/api";
import { CategoryFilter } from "../components/CategoryFilter";
import { useState } from "react";
import type { EventCategory } from "../types";

const FILM_CATEGORIES: EventCategory[] = ["film", "screening", "meetup", "networking", "volunteer"];

const RESOURCES = [
  {
    name: "Mandy.com",
    desc: "The #1 site for film jobs and crew calls in NYC. Post your skills or find paid/unpaid opportunities.",
    url: "https://mandy.com",
    emoji: "💼",
    category: "Jobs & Crew",
  },
  {
    name: "Staff Me Up",
    desc: "Professional film & TV crew booking. Where production companies find day players and union crew.",
    url: "https://staffmeup.com",
    emoji: "🎬",
    category: "Jobs & Crew",
  },
  {
    name: "Film Freeway",
    desc: "Submit your films to 10,000+ festivals. NYC has dozens of screenings monthly via Film Freeway.",
    url: "https://filmfreeway.com",
    emoji: "🏆",
    category: "Festivals",
  },
  {
    name: "NYC Filmmakers Collective",
    desc: "500+ member strong community of NYC filmmakers. Monthly meetups, pitch sessions, and crew matching.",
    url: "https://meetup.com",
    emoji: "🤝",
    category: "Community",
  },
  {
    name: "IFP / Gotham Film & Media Institute",
    desc: "NYC's premiere indie film org. Labs, grants, mentorship, and the Gotham Awards. Essential for serious filmmakers.",
    url: "https://gotham.org",
    emoji: "🌟",
    category: "Industry",
  },
  {
    name: "Rooftop Films",
    desc: "Iconic outdoor screenings + short film fund. Apply to screen your work or attend legendary rooftop events.",
    url: "https://rooftopfilms.com",
    emoji: "🌙",
    category: "Screenings",
  },
  {
    name: "Metrograph",
    desc: "LES's beloved indie cinema. Cult films, director Q&As, and a scene of serious cinephiles. Great networking spot.",
    url: "https://metrograph.com",
    emoji: "🎞️",
    category: "Screenings",
  },
  {
    name: "Anthology Film Archives",
    desc: "Essential avant-garde film archive and screening space. Short film showcases and filmmaker community events.",
    url: "https://anthologyfilmarchives.org",
    emoji: "📽️",
    category: "Screenings",
  },
  {
    name: "No Budget Film School (NYC)",
    desc: "Free filmmaking workshops and hands-on production practice. Perfect for beginners breaking into the industry.",
    url: "https://meetup.com",
    emoji: "🎓",
    category: "Education",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  "Jobs & Crew": "💼",
  "Festivals": "🏆",
  "Community": "🤝",
  "Industry": "🌟",
  "Screenings": "🎞️",
  "Education": "🎓",
};

export function FilmPage() {
  const [activeFilters, setActiveFilters] = useState<EventCategory[]>(["film", "screening"]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["events-film", activeFilters],
    queryFn: api.events.film,
    staleTime: 10 * 60 * 1000,
  });

  const events = data?.data ?? [];

  const categories = [...new Set(RESOURCES.map((r) => r.category))];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title="🎥 Film Scene"
        subtitle="NYC filmmaking community"
        showNotificationBell={false}
      />

      <div className="flex-1 px-4 pt-4 max-w-lg mx-auto w-full">
        {/* Hero */}
        <div className="mb-4 p-4 bg-gradient-to-r from-red-900/40 to-purple-900/40 border border-red-800/30 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Clapperboard size={16} className="text-red-400" />
            <span className="text-sm font-bold text-red-300">Break Into NYC Film</span>
          </div>
          <p className="text-xs text-gray-400">
            NYC has the most active indie film scene in the world. Events, screenings, and crew opportunities updated weekly.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilter
            selected={activeFilters}
            onChange={setActiveFilters}
            options={FILM_CATEGORIES}
          />
        </div>

        {/* Events */}
        {isLoading && <LoadingSpinner message="Finding film events & opportunities..." />}

        {error && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl text-xs text-yellow-400">
            Showing offline events — start the backend for live data.
          </div>
        )}

        {!isLoading && (
          <section className="mb-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Film size={11} />
              Film Events This Week
            </h2>
            {events.length === 0 ? (
              <EmptyState
                emoji="🎬"
                title="Check back soon"
                body="Film events and crew calls refresh daily. Start the backend for live data from multiple sources."
              />
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Resources by category */}
        {categories.map((category) => (
          <section key={category} className="mb-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>{CATEGORY_LABELS[category]}</span>
              {category}
            </h2>
            <div className="space-y-2.5">
              {RESOURCES.filter((r) => r.category === category).map((resource) => (
                <a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-card flex gap-3 p-3.5 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl hover:border-[#3a3a6a] transition-colors"
                >
                  <span className="text-2xl shrink-0">{resource.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-bold truncate">{resource.name}</h3>
                      <ExternalLink size={11} className="text-gray-600 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{resource.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        {/* Pro Tips */}
        <div className="mt-4 p-4 bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl">
          <h3 className="text-xs font-bold text-gray-300 mb-2">🎯 Breaking In Tips</h3>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li>• Start as a PA on student films — NYU, Columbia, and SVA all post crew calls</li>
            <li>• Join NYC Filmmakers Collective meetup — the best networking in the city</li>
            <li>• Volunteer at Tribeca Film Festival for industry access</li>
            <li>• Screen your work at Anthology or Rooftop Films to build your name</li>
            <li>• IFP Gotham Labs can fund your first feature — apply every year</li>
          </ul>
        </div>

        {/* Networks */}
        <div className="mt-3 p-4 bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl">
          <h3 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
            <Users size={12} />
            Online Communities
          </h3>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li>• r/NYCFilmmakers — Reddit community for NYC-based filmmakers</li>
            <li>• NYC Indie Film Facebook Group — crew calls, events, and support</li>
            <li>• Clubhouse NYC Film rooms on Tuesday evenings</li>
            <li>• ProductionHUB NYC — professional crew and equipment rentals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
