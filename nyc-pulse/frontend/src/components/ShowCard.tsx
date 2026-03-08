import { ExternalLink, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ShowTicket } from "../types";
import { useState } from "react";
import clsx from "clsx";

interface ShowCardProps {
  show: ShowTicket;
}

const NETWORK_COLORS: Record<string, string> = {
  CBS: "bg-blue-600",
  NBC: "bg-red-600",
  HBO: "bg-purple-600",
  "Comedy Central": "bg-yellow-600",
  ABC: "bg-blue-500",
};

export function ShowCard({ show }: ShowCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={clsx(
      "bg-[#1a1a2e] border rounded-2xl overflow-hidden transition-all duration-200",
      show.isLotteryOpen
        ? "border-[#e63946]/60 shadow-lg shadow-[#e63946]/10"
        : "border-[#2a2a4a]"
    )}>
      {/* Lottery Open Banner */}
      {show.isLotteryOpen && (
        <div className="lottery-open-badge text-white text-xs font-bold text-center py-1.5 tracking-wide uppercase">
          🎟️ Lottery Open Now — Enter Before It Closes!
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Network Badge */}
          <div className={clsx(
            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold",
            NETWORK_COLORS[show.network] ?? "bg-gray-700"
          )}>
            {show.network.slice(0, 3)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold leading-tight">{show.showName}</h3>
              {show.isLotteryOpen ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#e63946] bg-[#e63946]/15 px-2 py-0.5 rounded-full border border-[#e63946]/30">
                  <CheckCircle size={9} />
                  OPEN
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-700/30 px-2 py-0.5 rounded-full">
                  <XCircle size={9} />
                  Closed
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              with {show.host} · {show.network}
            </p>
            <p className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
              <Clock size={9} />
              Checked {formatDistanceToNow(new Date(show.lastChecked))} ago
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-gray-400 line-clamp-2">{show.description}</p>

        {/* Expand for How to Apply */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-[#4361ee] hover:text-[#6b8cf7] transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? "Hide" : "How to get tickets"}
        </button>

        {expanded && (
          <div className="mt-2 p-3 bg-[#0f0f1a] rounded-xl border border-[#2a2a4a]">
            <p className="text-xs text-gray-300 leading-relaxed">{show.howToApply}</p>
          </div>
        )}

        {/* CTA Button */}
        <a
          href={show.lotteryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95",
            show.isLotteryOpen
              ? "bg-[#e63946] text-white hover:bg-[#d32f3f]"
              : "bg-[#2a2a4a] text-gray-400 hover:bg-[#3a3a5a] hover:text-white"
          )}
        >
          <ExternalLink size={14} />
          {show.isLotteryOpen ? "Enter Lottery Now!" : "Watch for Tickets"}
        </a>
      </div>
    </div>
  );
}
