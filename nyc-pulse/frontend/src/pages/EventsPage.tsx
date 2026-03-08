import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Sparkles } from "lucide-react";
import { Header } from "../components/Header";
import { EventCard } from "../components/EventCard";
import { CategoryFilter } from "../components/CategoryFilter";
import { LoadingSpinner, EmptyState } from "../components/LoadingSpinner";
import { usePreferences } from "../hooks/usePreferences";
import { api } from "../services/api";
import type { EventCategory } from "../types";
import { formatDistanceToNow } from "date-fns";

export function EventsPage() {
  const { prefs } = usePreferences();
  const [activeFilters, setActiveFilters] = useState<EventCategory[]>(prefs.interests);
  const [digest, setDigest] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["events", activeFilters, prefs.toddlerMode, prefs.filmMode],
    queryFn: () =>
      api.events.list({
        interests: activeFilters,
        toddler: prefs.toddlerMode,
        film: prefs.filmMode,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const loadDigest = async () => {
    setDigestLoading(true);
    try {
      const result = await api.events.digest(activeFilters.length > 0 ? activeFilters : prefs.interests);
      setDigest(result.digest);
    } catch {
      setDigest(null);
    } finally {
      setDigestLoading(false);
    }
  };

  const events = data?.data ?? [];
  const featuredEvents = events.filter((e) => e.isFeatured);
  const regularEvents = events.filter((e) => !e.isFeatured);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title="🗽 NYC Pulse"
        subtitle={
          dataUpdatedAt
            ? `Updated ${formatDistanceToNow(dataUpdatedAt)} ago`
            : "Your NYC life companion"
        }
      />

      <div className="flex-1 px-4 pt-4 max-w-lg mx-auto w-full">
        {/* AI Digest Button */}
        <button
          onClick={loadDigest}
          disabled={digestLoading}
          className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#4361ee] to-[#7b2d8b] rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
        >
          <Sparkles size={15} />
          {digestLoading ? "Generating digest..." : "✨ Get AI Weekly Digest"}
        </button>

        {/* Digest Card */}
        {digest && (
          <div className="mb-4 p-4 bg-[#1a1a2e] border border-[#4361ee]/40 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-[#4361ee] text-xs font-semibold">
              <Sparkles size={12} />
              AI-Powered Weekly Digest
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{digest}</p>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilter selected={activeFilters} onChange={setActiveFilters} />
        </div>

        {/* Refresh */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">
            {isLoading ? "Loading..." : `${events.length} events this week`}
          </p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700/30 rounded-xl text-xs text-red-400">
            Backend offline — showing cached events. Start the backend server for live data.
          </div>
        )}

        {/* Loading */}
        {isLoading && <LoadingSpinner message="Finding the best NYC events..." />}

        {/* Featured */}
        {!isLoading && featuredEvents.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold text-[#ffd700] uppercase tracking-widest mb-2 flex items-center gap-1">
              ⭐ Featured This Week
            </h2>
            <div className="space-y-3">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* All Events */}
        {!isLoading && (
          <section className="mb-4">
            {featuredEvents.length > 0 && (
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                More Events
              </h2>
            )}
            {regularEvents.length === 0 && featuredEvents.length === 0 ? (
              <EmptyState
                emoji="🗓️"
                title="No events found"
                body="Try selecting different categories or check back later for new events."
              />
            ) : (
              <div className="space-y-3">
                {regularEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Mode badges */}
        {(prefs.toddlerMode || prefs.filmMode) && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {prefs.toddlerMode && (
              <span className="text-xs bg-green-900/30 text-green-400 px-3 py-1 rounded-full border border-green-800/40">
                🧒 Toddler-friendly mode on
              </span>
            )}
            {prefs.filmMode && (
              <span className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded-full border border-red-800/40">
                🎥 Film discovery mode on
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
