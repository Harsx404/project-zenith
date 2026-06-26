"use client";

import { CelestialObject } from "@/lib/types/celestial";
import {
  Telescope,
  Satellite,
  Globe2,
  Sparkles,
  Search,
  X,
} from "lucide-react";

interface ObjectListProps {
  objects: CelestialObject[];
  onSelectObject: (obj: CelestialObject) => void;
  selectedObjectId?: string;
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case "ISS":
      return <Telescope className="w-4 h-4" />;
    case "Satellite":
      return <Satellite className="w-4 h-4" />;
    case "Planet":
      return <Globe2 className="w-4 h-4" />;
    case "Constellation":
      return <Sparkles className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

export default function ObjectList({
  objects,
  onSelectObject,
  selectedObjectId,
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
}: ObjectListProps) {
  // Filter by search query (case-insensitive name match)
  const filtered = objects.filter((obj) =>
    obj.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by altitude descending
  const sorted = [...filtered].sort((a, b) => b.altitude - a.altitude);

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[380px] z-40 flex flex-col bg-black/95 md:bg-black/80 backdrop-blur-xl border-l border-white/10 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-sm font-heading text-white tracking-[0.2em] font-bold uppercase">
            Detected Objects ({filtered.length})
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search objects..."
              className="w-full bg-black/50 border border-white/10 text-white placeholder-white/30 p-3 pl-10 text-sm tracking-widest font-heading focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable object list */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/30 text-sm font-heading tracking-widest">
              No objects found.
            </div>
          ) : (
            <div className="space-y-1">
              {sorted.map((obj) => {
                const isSelected = obj.id === selectedObjectId;
                const isNearZenith = obj.altitude >= 80;
                const isVisible = obj.altitude >= 0;

                return (
                  <button
                    key={obj.id}
                    onClick={() => onSelectObject(obj)}
                    className={`w-full text-left p-4 flex items-center justify-between transition-all border-b border-white/5 ${
                      isSelected
                        ? "bg-cyan-500/15 border-l-2 border-l-cyan-400"
                        : isNearZenith
                          ? "bg-cyan-500/5 hover:bg-cyan-500/10"
                          : "bg-transparent hover:bg-white/5"
                    }`}
                  >
                    {/* Left: icon + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                      <div
                        className={`shrink-0 p-2 border ${
                          isNearZenith
                            ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300"
                            : obj.zenithETA
                              ? "bg-purple-500/20 border-purple-400/50 text-purple-300"
                              : "border-white/20 text-white/60"
                        }`}
                      >
                        {getIcon(obj.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`font-heading tracking-widest text-sm font-bold truncate ${
                            isNearZenith ? "text-cyan-300" : "text-white"
                          }`}
                        >
                          {obj.name}
                        </h4>
                        <div className="text-[10px] text-white/40 tracking-[0.1em] mt-1 truncate">
                          ALT: {obj.altitude.toFixed(1)}°
                          {obj.orbitalHeightKm
                            ? ` · ORBIT: ${Math.round(obj.orbitalHeightKm)} KM`
                            : ""}
                        </div>
                      </div>
                    </div>

                    {/* Right: badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {/* Visibility / Zenith badge */}
                      {isNearZenith ? (
                        <span className="text-[9px] uppercase px-2 py-1 font-heading tracking-widest border bg-cyan-500/30 text-cyan-200 border-cyan-400 animate-pulse font-bold">
                          ZENITH
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] uppercase px-2 py-1 font-heading tracking-widest border ${
                            isVisible
                              ? "bg-transparent text-white/70 border-white/30"
                              : "bg-transparent text-white/20 border-white/10"
                          }`}
                        >
                          {obj.visibilityStatus}
                        </span>
                      )}

                      {/* Zenith ETA badge */}
                      {obj.zenithETA && !isNearZenith && (
                        <span className="text-[9px] uppercase px-2 py-1 font-heading tracking-widest border bg-purple-500/25 text-purple-300 border-purple-400/60 font-bold animate-pulse">
                          ETA:{" "}
                          {Math.max(
                            1,
                            Math.round(
                              (new Date(obj.zenithETA).getTime() -
                                Date.now()) /
                                60000
                            )
                          )}{" "}
                          MINS
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
