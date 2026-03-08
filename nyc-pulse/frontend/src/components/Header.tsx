import { Bell, BellDot } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNotificationBell?: boolean;
}

export function Header({ title, subtitle, showNotificationBell = true }: HeaderProps) {
  const { permission, isSupported, requestPermission } = useNotifications();

  return (
    <header className="sticky top-0 z-40 bg-[#0f0f1a]/95 backdrop-blur-xl border-b border-[#2a2a4a] px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {showNotificationBell && isSupported && (
          <button
            onClick={() => requestPermission()}
            className="p-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] text-gray-400 hover:text-[#e63946] hover:border-[#e63946]/30 transition-all duration-150"
            title={permission === "granted" ? "Notifications on" : "Enable notifications"}
          >
            {permission === "granted" ? (
              <BellDot size={18} className="text-[#e63946]" />
            ) : (
              <Bell size={18} />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
