import { NavLink } from "react-router-dom";
import { CalendarDays, Tv, Baby, Film, Settings } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { to: "/", icon: CalendarDays, label: "Events" },
  { to: "/shows", icon: Tv, label: "Shows" },
  { to: "/toddler", icon: Baby, label: "Kids" },
  { to: "/film", icon: Film, label: "Film" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-[#1a1a2e]/95 backdrop-blur-xl border-t border-[#2a2a4a] z-50">
      <div className="flex items-stretch max-w-lg mx-auto">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 min-h-[56px] transition-colors duration-150",
                isActive
                  ? "text-[#e63946]"
                  : "text-gray-500 hover:text-gray-300"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={clsx(
                    "w-10 h-6 flex items-center justify-center rounded-full transition-all duration-150",
                    isActive ? "bg-[#e63946]/15" : "bg-transparent"
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className={clsx("text-[10px] font-medium tracking-wide", isActive ? "text-[#e63946]" : "text-gray-500")}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
