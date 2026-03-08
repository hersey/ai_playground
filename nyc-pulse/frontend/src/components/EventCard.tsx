import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { MapPin, ExternalLink, Sparkles, Baby, Film, Star } from "lucide-react";
import { CATEGORY_CONFIG } from "../types";
import type { Event, EventCategory } from "../types";
import clsx from "clsx";

interface EventCardProps {
  event: Event;
  compact?: boolean;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
  if (isThisWeek(date)) return format(date, "EEEE 'at' h:mm a");
  return format(date, "MMM d 'at' h:mm a");
}

const CATEGORY_COLORS: Record<string, string> = {
  broadway: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  comedy: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  theater: "bg-purple-600/20 text-purple-200 border-purple-600/30",
  art: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  music: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  food: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  film: "bg-red-500/20 text-red-300 border-red-500/30",
  screening: "bg-red-600/20 text-red-200 border-red-600/30",
  toddler: "bg-green-500/20 text-green-300 border-green-500/30",
  outdoor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cultural: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  community: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  meetup: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  networking: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  volunteer: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  gallery: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  festival: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  sports: "bg-green-700/20 text-green-200 border-green-700/30",
};

export function EventCard({ event, compact = false }: EventCardProps) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="event-card block bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl overflow-hidden hover:border-[#3a3a6a] transition-colors"
    >
      {/* Image */}
      {event.imageUrl && !compact && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="gradient-bottom absolute inset-0" />
          {event.isFeatured && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#e63946] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              <Star size={10} fill="currentColor" />
              Featured
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Featured badge (no image) */}
        {event.isFeatured && !event.imageUrl && (
          <div className="flex items-center gap-1 text-[#e63946] text-xs font-semibold mb-2">
            <Star size={11} fill="currentColor" />
            <span>Featured</span>
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {event.categories.slice(0, compact ? 2 : 3).map((cat) => (
            <span
              key={cat}
              className={clsx(
                "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                CATEGORY_COLORS[cat] ?? "bg-gray-600/20 text-gray-300 border-gray-600/30"
              )}
            >
              {CATEGORY_CONFIG[cat as EventCategory]?.emoji} {CATEGORY_CONFIG[cat as EventCategory]?.label ?? cat}
            </span>
          ))}
          {event.isToddlerFriendly && !event.categories.includes("toddler") && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-green-500/20 text-green-300 border-green-500/30">
              <Baby size={9} /> Kids OK
            </span>
          )}
          {event.isFilmRelated && !event.categories.includes("film") && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-red-500/20 text-red-300 border-red-500/30">
              <Film size={9} /> Film
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={clsx("font-bold leading-snug", compact ? "text-sm" : "text-base")}>
          {event.title}
        </h3>

        {/* AI Summary */}
        {event.aiSummary && (
          <p className="flex items-start gap-1.5 mt-1.5 text-xs text-[#06d6a0] italic">
            <Sparkles size={11} className="mt-0.5 shrink-0" />
            {event.aiSummary}
          </p>
        )}

        {/* Description */}
        {!compact && !event.aiSummary && (
          <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#ffd700]">
              {formatEventDate(event.date)}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-gray-500 shrink-0" />
              <p className="text-[11px] text-gray-400 truncate">
                {event.venue}{event.neighborhood ? `, ${event.neighborhood}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={clsx(
              "text-xs font-bold px-2.5 py-1 rounded-full",
              event.price === "Free" || event.price === "Free entry"
                ? "bg-[#06d6a0]/15 text-[#06d6a0]"
                : "bg-[#e63946]/15 text-[#e63946]"
            )}>
              {event.price}
            </span>
            <ExternalLink size={13} className="text-gray-600" />
          </div>
        </div>
      </div>
    </a>
  );
}
