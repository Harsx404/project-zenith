"use client";

import { useRef, useState } from "react";
import { Search, Crosshair, Check } from "lucide-react";

export type GpsStatus = "idle" | "locating" | "located" | "error" | "using_saved";

interface CoordinateInputProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  onUseCurrentLocation: () => void;
  gpsStatus?: GpsStatus;
  gpsError?: string | null;
  hasLocation?: boolean;
}

export default function CoordinateInput({
  lat,
  lng,
  onChange,
  onUseCurrentLocation,
  gpsStatus = "idle",
  gpsError,
  hasLocation = lat !== 0 || lng !== 0,
}: CoordinateInputProps) {
  const latInputRef = useRef<HTMLInputElement>(null);
  const lngInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const inputKey = hasLocation ? `${lat}:${lng}` : "empty";
  const isLocating = gpsStatus === "locating";

  const handleApply = () => {
    const parsedLat = parseFloat(latInputRef.current?.value || "");
    const parsedLng = parseFloat(lngInputRef.current?.value || "");
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        onChange(parsedLat, parsedLng);
      } else {
        alert("Latitude must be between -90 and 90. Longitude between -180 and 180.");
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      alert("Mapbox token is missing!");
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&limit=1`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [foundLng, foundLat] = data.features[0].center;
        onChange(foundLat, foundLng);
        setSearchQuery("");
      } else {
        alert("Location not found.");
      }
    } catch (e) {
      alert("Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const statusLabel = {
    idle: "Awaiting target",
    locating: "Locating current position...",
    located: "GPS lock acquired",
    error: "GPS unavailable",
    using_saved: "Using saved coordinates",
  }[gpsStatus];

  return (
    <div className="w-full space-y-6">
      <div>
        <h3 className="text-sm font-heading text-cyan-50 tracking-[0.2em] flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" /> OBSERVATION POINT
        </h3>
        <p className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${
          gpsStatus === "error" ? "text-red-400" : gpsStatus === "locating" ? "text-cyan-400 animate-pulse" : "text-white/40"
        }`}>
          {statusLabel}
        </p>
        {gpsError && (
          <p className="mt-2 text-xs leading-relaxed text-red-400/90">
            {gpsError}
          </p>
        )}
      </div>

      <div className="space-y-5 pb-2">
        <div className="relative group">
           <input 
             type="text"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
             placeholder="Search location..."
             className="w-full bg-black/60 border border-cyan-900/40 px-3 py-3 pl-4 pr-12 text-cyan-50 focus:outline-none focus:border-cyan-400 transition-all text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] placeholder-white/30 group-hover:border-cyan-900/80"
           />
           <button 
             onClick={handleSearch}
             disabled={isSearching || !searchQuery.trim()}
             className="absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center hover:bg-cyan-900/30 text-cyan-400 transition-colors border-l border-cyan-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Search className={`w-4 h-4 ${isSearching ? "animate-pulse" : ""}`} />
           </button>
        </div>
        
        <div className="flex items-center gap-4 opacity-70">
           <div className="h-px bg-cyan-900/50 flex-1"></div>
           <span className="text-[9px] text-cyan-100/40 uppercase tracking-[0.3em]">OR MANUAL ENTRY</span>
           <div className="h-px bg-cyan-900/50 flex-1"></div>
        </div>
      </div>
      
      <div key={inputKey} className="grid grid-cols-2 gap-4 sm:gap-8">
        <div>
          <label className="block text-[10px] text-cyan-100/50 mb-1 uppercase tracking-widest">Latitude</label>
          <input 
            ref={latInputRef}
            type="number"
            defaultValue={hasLocation ? Number(lat).toFixed(6) : ""}
            className="w-full bg-transparent border-b border-cyan-900/50 px-0 py-2 text-cyan-50 focus:outline-none focus:border-cyan-400 transition-colors font-mono text-sm placeholder-white/20"
            placeholder="e.g. 13.0827"
          />
        </div>
        <div>
          <label className="block text-[10px] text-cyan-100/50 mb-1 uppercase tracking-widest">Longitude</label>
          <input 
            ref={lngInputRef}
            type="number"
            defaultValue={hasLocation ? Number(lng).toFixed(6) : ""}
            className="w-full bg-transparent border-b border-cyan-900/50 px-0 py-2 text-cyan-50 focus:outline-none focus:border-cyan-400 transition-colors font-mono text-sm placeholder-white/20"
            placeholder="e.g. 80.2707"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2 sm:pt-4">
        <button 
          onClick={handleApply}
          className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-cyan-900/50 hover:border-cyan-400 text-cyan-50 py-3 text-[10px] sm:text-xs tracking-[0.2em] font-heading transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-950/30"
        >
          <Check className="w-4 h-4 text-cyan-400" /> APPLY
        </button>
        <button 
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className={`flex-1 flex items-center justify-center gap-2 border py-3 text-[10px] sm:text-xs tracking-[0.2em] font-heading transition-all ${
            isLocating ? "border-cyan-900/30 text-cyan-700 cursor-wait bg-transparent" : "border-cyan-900/50 hover:border-cyan-400 text-cyan-50 bg-cyan-950/20 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          }`}
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? "animate-spin text-cyan-700" : "text-cyan-400"}`} /> 
          {isLocating ? "LOCATING..." : "USE CURRENT"}
        </button>
      </div>
    </div>
  );
}
