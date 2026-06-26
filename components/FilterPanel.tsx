"use client";

import { Telescope, Satellite, Globe2, Sparkles, type LucideIcon } from "lucide-react";

export type FilterTypes = "ISS" | "Satellite" | "Planet" | "Constellation";

interface FilterPanelProps {
  filters: Record<FilterTypes, boolean>;
  onToggle: (type: FilterTypes) => void;
}

const FILTER_ICONS: Record<FilterTypes, LucideIcon> = {
  ISS: Telescope,
  Satellite: Satellite,
  Planet: Globe2,
  Constellation: Sparkles,
};

const FILTER_ORDER: FilterTypes[] = ["ISS", "Satellite", "Planet", "Constellation"];

export default function FilterPanel({ filters, onToggle }: FilterPanelProps) {
  return (
    <div className="flex flex-row md:flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 snap-x w-full">
      {FILTER_ORDER.map((type) => {
        const Icon = FILTER_ICONS[type];
        const active = filters[type];

        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={[
              "shrink-0 snap-start px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs uppercase tracking-widest font-heading border rounded-full transition-all cursor-pointer flex items-center gap-1.5 md:gap-2",
              active
                ? "bg-white/15 border-white/40 text-white shadow-[0_0_8px_rgba(255,255,255,0.12)]"
                : "bg-transparent border-white/10 text-white/40 hover:text-white/60",
            ].join(" ")}
          >
            <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {type}
          </button>
        );
      })}
    </div>
  );
}
