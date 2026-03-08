import { useState } from "react";
import { Check, Bell, BellOff, Save, RotateCcw } from "lucide-react";
import { Header } from "../components/Header";
import { CategoryFilter } from "../components/CategoryFilter";
import { usePreferences } from "../hooks/usePreferences";
import { useNotifications } from "../hooks/useNotifications";
import type { EventCategory } from "../types";
import clsx from "clsx";

const SHOWS = [
  { id: "colbert", name: "The Late Show (Colbert)" },
  { id: "daily-show", name: "The Daily Show" },
  { id: "seth-meyers", name: "Late Night (Seth Meyers)" },
  { id: "fallon", name: "The Tonight Show (Fallon)" },
  { id: "snl", name: "Saturday Night Live" },
  { id: "john-oliver", name: "Last Week Tonight" },
  { id: "gma", name: "Good Morning America" },
  { id: "today-show", name: "The Today Show" },
];

export function SettingsPage() {
  const { prefs, savePrefs, isSaving } = usePreferences();
  const { permission, isSupported, requestPermission } = useNotifications();
  const [saved, setSaved] = useState(false);

  const [interests, setInterests] = useState<EventCategory[]>(prefs.interests);
  const [toddlerMode, setToddlerMode] = useState(prefs.toddlerMode);
  const [filmMode, setFilmMode] = useState(prefs.filmMode);
  const [maxPrice, setMaxPrice] = useState<string>(prefs.maxPrice?.toString() ?? "");
  const [showAlerts, setShowAlerts] = useState<string[]>(prefs.showLotteryAlerts);

  const toggleShow = (id: string) => {
    setShowAlerts((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    savePrefs({
      interests,
      toddlerMode,
      filmMode,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      showLotteryAlerts: showAlerts,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEnableNotifications = async () => {
    await requestPermission(["shows", "events", "all"]);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header title="⚙️ Settings" subtitle="Personalize your NYC experience" showNotificationBell={false} />

      <div className="flex-1 px-4 pt-4 max-w-lg mx-auto w-full space-y-6">
        {/* Interests */}
        <section>
          <h2 className="text-sm font-bold text-gray-200 mb-1">Your Interests</h2>
          <p className="text-xs text-gray-500 mb-3">
            We'll use Claude AI to curate events just for you.
          </p>
          <CategoryFilter
            selected={interests}
            onChange={setInterests}
          />
          {interests.length === 0 && (
            <p className="text-xs text-yellow-500 mt-2">Select at least one interest for personalized events.</p>
          )}
        </section>

        {/* Modes */}
        <section>
          <h2 className="text-sm font-bold text-gray-200 mb-3">Discovery Modes</h2>
          <div className="space-y-2">
            <button
              onClick={() => setToddlerMode(!toddlerMode)}
              className={clsx(
                "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                toddlerMode
                  ? "bg-green-900/30 border-green-700/50 text-green-300"
                  : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧒</span>
                <div className="text-left">
                  <p className="text-sm font-semibold">Toddler Mode</p>
                  <p className="text-xs opacity-70">Prioritize family & kid-friendly events</p>
                </div>
              </div>
              <div className={clsx(
                "w-10 h-6 rounded-full transition-all relative",
                toddlerMode ? "bg-green-500" : "bg-gray-700"
              )}>
                <div className={clsx(
                  "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                  toddlerMode ? "right-1" : "left-1"
                )} />
              </div>
            </button>

            <button
              onClick={() => setFilmMode(!filmMode)}
              className={clsx(
                "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                filmMode
                  ? "bg-red-900/30 border-red-700/50 text-red-300"
                  : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎥</span>
                <div className="text-left">
                  <p className="text-sm font-semibold">Film Discovery Mode</p>
                  <p className="text-xs opacity-70">Highlight filmmaking events & opportunities</p>
                </div>
              </div>
              <div className={clsx(
                "w-10 h-6 rounded-full transition-all relative",
                filmMode ? "bg-red-500" : "bg-gray-700"
              )}>
                <div className={clsx(
                  "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                  filmMode ? "right-1" : "left-1"
                )} />
              </div>
            </button>
          </div>
        </section>

        {/* Budget */}
        <section>
          <h2 className="text-sm font-bold text-gray-200 mb-1">Budget Filter</h2>
          <p className="text-xs text-gray-500 mb-3">Max ticket price (leave empty for any price)</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any price"
              className="flex-1 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e63946]/50"
            />
          </div>
        </section>

        {/* Notification Settings */}
        <section>
          <h2 className="text-sm font-bold text-gray-200 mb-1">Notifications</h2>
          <p className="text-xs text-gray-500 mb-3">Get alerted when show lotteries open</p>

          {isSupported ? (
            <>
              {permission !== "granted" ? (
                <button
                  onClick={handleEnableNotifications}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#4361ee] rounded-xl text-sm font-semibold text-white hover:bg-[#3250dd] transition-colors mb-3"
                >
                  <Bell size={15} />
                  Enable Push Notifications
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/30 rounded-xl text-green-400 text-xs mb-3">
                  <Bell size={14} />
                  Push notifications enabled! ✅
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-xl text-yellow-400 text-xs mb-3">
              <BellOff size={14} />
              Notifications not supported in this browser.
            </div>
          )}

          {/* Show Lottery Alerts */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">Alert me when these shows have tickets:</p>
            {SHOWS.map((show) => (
              <button
                key={show.id}
                onClick={() => toggleShow(show.id)}
                className={clsx(
                  "w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all",
                  showAlerts.includes(show.id)
                    ? "bg-[#e63946]/15 border-[#e63946]/40 text-[#e63946]"
                    : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400"
                )}
              >
                <span className="font-medium">{show.name}</span>
                {showAlerts.includes(show.id) && (
                  <div className="w-5 h-5 bg-[#e63946] rounded-full flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="pb-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={clsx(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-bold transition-all active:scale-98",
              saved
                ? "bg-[#06d6a0] text-black"
                : "bg-[#e63946] text-white hover:bg-[#d32f3f]",
              isSaving && "opacity-70"
            )}
          >
            {saved ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                {isSaving ? "Saving..." : "Save Preferences"}
              </>
            )}
          </button>

          <button
            onClick={() => {
              setInterests(["broadway", "comedy", "theater", "art"]);
              setToddlerMode(false);
              setFilmMode(false);
              setMaxPrice("");
              setShowAlerts(["colbert", "fallon", "snl"]);
            }}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RotateCcw size={12} />
            Reset to defaults
          </button>
        </div>

        {/* About */}
        <div className="p-4 bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl text-xs text-gray-500">
          <p className="font-semibold text-gray-400 mb-1">🤖 Powered by Claude AI</p>
          <p>NYC Pulse uses Claude claude-opus-4-6 to intelligently curate events, write weekly digests, and discover film-relevant content from hundreds of sources.</p>
        </div>
      </div>
    </div>
  );
}
