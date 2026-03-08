import { CATEGORY_CONFIG } from "../types";
import type { EventCategory } from "../types";
import clsx from "clsx";

interface CategoryFilterProps {
  selected: EventCategory[];
  onChange: (categories: EventCategory[]) => void;
  options?: EventCategory[];
}

const DEFAULT_OPTIONS: EventCategory[] = [
  "broadway", "comedy", "theater", "art", "music", "food",
  "film", "outdoor", "cultural", "gallery", "screening", "meetup",
];

export function CategoryFilter({ selected, onChange, options = DEFAULT_OPTIONS }: CategoryFilterProps) {
  const toggle = (cat: EventCategory) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-4 -mx-4 scrollbar-hide no-scrollbar">
      {options.map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const isActive = selected.includes(cat);
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={clsx(
              "category-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all",
              isActive
                ? "bg-[#e63946] border-[#e63946] text-white shadow-lg shadow-[#e63946]/25"
                : "bg-[#1a1a2e] border-[#2a2a4a] text-gray-400 hover:border-[#3a3a6a] hover:text-gray-200"
            )}
          >
            <span>{config.emoji}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
