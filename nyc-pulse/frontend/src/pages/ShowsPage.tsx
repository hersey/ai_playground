import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Ticket, AlertCircle } from "lucide-react";
import { Header } from "../components/Header";
import { ShowCard } from "../components/ShowCard";
import { LoadingSpinner, EmptyState } from "../components/LoadingSpinner";
import { api } from "../services/api";
import { useNotifications } from "../hooks/useNotifications";
import { useState } from "react";

export function ShowsPage() {
  const { permission, isSupported, requestPermission } = useNotifications();
  const [notifSuccess, setNotifSuccess] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shows"],
    queryFn: api.shows.list,
    refetchInterval: 15 * 60 * 1000, // auto-refresh every 15 min
  });

  const { mutate: checkNow, isPending: isChecking } = useMutation({
    mutationFn: api.shows.check,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shows"] }),
  });

  const handleEnableAlerts = async () => {
    const ok = await requestPermission(["shows", "all"]);
    if (ok) setNotifSuccess(true);
  };

  const shows = data?.data ?? [];
  const openShows = shows.filter((s) => s.isLotteryOpen);
  const closedShows = shows.filter((s) => !s.isLotteryOpen);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title="🎟️ Show Tickets"
        subtitle="Late night shows & lotteries"
      />

      <div className="flex-1 px-4 pt-4 max-w-lg mx-auto w-full">
        {/* Notification CTA */}
        {isSupported && permission !== "granted" && !notifSuccess && (
          <div className="mb-4 p-4 bg-[#4361ee]/15 border border-[#4361ee]/30 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-[#4361ee] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#4361ee]">Never miss a lottery!</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Get instant alerts the moment a show lottery opens.
                </p>
                <button
                  onClick={handleEnableAlerts}
                  className="mt-2 text-xs font-semibold text-white bg-[#4361ee] px-3 py-1.5 rounded-lg hover:bg-[#3250dd] transition-colors"
                >
                  Enable Lottery Alerts
                </button>
              </div>
            </div>
          </div>
        )}

        {notifSuccess && (
          <div className="mb-4 p-3 bg-[#06d6a0]/15 border border-[#06d6a0]/30 rounded-2xl text-sm text-[#06d6a0]">
            ✅ You'll be notified the moment a lottery opens!
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {openShows.length > 0 ? (
              <span className="text-xs font-bold text-[#e63946] bg-[#e63946]/15 px-2.5 py-1 rounded-full border border-[#e63946]/30">
                🎟️ {openShows.length} lottery open!
              </span>
            ) : (
              <span className="text-xs text-gray-500">{shows.length} shows monitored</span>
            )}
          </div>
          <button
            onClick={() => checkNow()}
            disabled={isChecking}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-[#1a1a2e] border border-[#2a2a4a] px-3 py-1.5 rounded-xl"
          >
            <RefreshCw size={11} className={isChecking ? "animate-spin" : ""} />
            {isChecking ? "Checking..." : "Check Now"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700/30 rounded-xl text-xs text-red-400">
            Backend offline — start the backend server for live lottery monitoring.
          </div>
        )}

        {/* Loading */}
        {isLoading && <LoadingSpinner message="Checking show lotteries..." />}

        {/* Open Lotteries */}
        {!isLoading && openShows.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-[#e63946] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Ticket size={12} />
              Lotteries Open Now
            </h2>
            <div className="space-y-3">
              {openShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          </section>
        )}

        {/* All Shows */}
        {!isLoading && (
          <section>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              {openShows.length > 0 ? "Other Shows" : "All Shows"}
            </h2>

            {shows.length === 0 ? (
              <EmptyState
                emoji="🎬"
                title="Show monitoring unavailable"
                body="Start the backend server to monitor NYC show lotteries in real time."
              />
            ) : (
              <div className="space-y-3">
                {(openShows.length > 0 ? closedShows : shows).map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* How it works */}
        <div className="mt-6 p-4 bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl">
          <h3 className="text-xs font-bold text-gray-300 mb-2">🤖 How lottery monitoring works</h3>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li>• We check 1iota.com and show websites every 15 minutes</li>
            <li>• The moment a lottery opens, you get an instant notification</li>
            <li>• Most shows use 1iota or On Camera Audiences for ticketing</li>
            <li>• SNL uses a separate August lottery — we track that too</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
