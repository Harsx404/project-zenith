"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CelestialObject, ScanResult } from "@/lib/types/celestial";
import ZenithRadar from "@/components/ZenithRadar";
import ObjectList from "@/components/ObjectList";
import ObjectDetails from "@/components/ObjectDetails";
import FilterPanel, { FilterTypes } from "@/components/FilterPanel";
import Loader from "@/components/Loader";
import { RefreshCw, MapPin, Maximize, Minimize, List, Clock, Satellite, Eye, Crosshair } from "lucide-react";
import { format } from "date-fns";

const playRadarPing = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // High-pitched sci-fi radar ping
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    
    // Quick attack, long fade out
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [filters, setFilters] = useState<Record<FilterTypes, boolean>>({
    ISS: true,
    Satellite: true,
    Planet: true,
    Constellation: true,
  });

  // New state for immersive UI
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [utcTime, setUtcTime] = useState<Date | null>(null);
  const [zenithAlerts, setZenithAlerts] = useState<string[]>([]);
  const prevZenithIdsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // UTC Clock
  useEffect(() => {
    setUtcTime(new Date());
    const interval = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchScanData = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await fetch(`/api/scan?lat=${lat}&lng=${lng}`);
      const data: ScanResult = await res.json();
      setScanResult(data);
    } catch (error) {
      console.error("Failed to fetch scan data", error);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    fetchScanData();
    const interval = setInterval(() => fetchScanData(true), 3000);
    return () => clearInterval(interval);
  }, [fetchScanData]);

  const toggleFilter = (type: FilterTypes) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const filteredObjects = scanResult?.objects.filter(obj => 
    filters[obj.type as FilterTypes] && (obj.altitude >= 0 || !!obj.zenithETA)
  ) || [];

  // Zenith Alerts — detect objects entering the zenith zone
  useEffect(() => {
    const currentZenithIds = new Set(
      filteredObjects.filter(obj => obj.altitude >= 80).map(obj => obj.id)
    );
    
    currentZenithIds.forEach(id => {
      if (!prevZenithIdsRef.current.has(id)) {
        const obj = filteredObjects.find(o => o.id === id);
        if (obj) {
          playRadarPing();
          setZenithAlerts(prev => [...prev, `${obj.name} entered ZENITH ZONE`]);
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setZenithAlerts(prev => prev.slice(1));
          }, 5000);
        }
      }
    });
    
    prevZenithIdsRef.current = currentZenithIds;
  }, [filteredObjects]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen change (e.g. user presses Esc)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        // Don't trigger if typing in an input
        if (document.activeElement?.tagName === "INPUT") return;
        toggleFullscreen();
      }
      if (e.key === "Escape") {
        if (selectedObject) {
          setSelectedObject(null);
        } else if (drawerOpen) {
          setDrawerOpen(false);
        }
      }
      if (e.key === "l" || e.key === "L") {
        if (document.activeElement?.tagName === "INPUT") return;
        setDrawerOpen(prev => !prev);
      }
      // Arrow keys to cycle through objects
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && filteredObjects.length > 0) {
        e.preventDefault();
        const currentIdx = selectedObject 
          ? filteredObjects.findIndex(o => o.id === selectedObject.id) 
          : -1;
        let nextIdx: number;
        if (e.key === "ArrowDown") {
          nextIdx = currentIdx < filteredObjects.length - 1 ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : filteredObjects.length - 1;
        }
        setSelectedObject(filteredObjects[nextIdx]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFullscreen, selectedObject, drawerOpen, filteredObjects]);

  // Quick stats
  const totalObjects = filteredObjects.length;
  const visibleObjects = filteredObjects.filter(o => o.altitude >= 0).length;
  const zenithObjects = filteredObjects.filter(o => o.altitude >= 80).length;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col relative bg-space-black overflow-hidden">
      {/* === IMMERSIVE GLOBE (full background) === */}
      <div className="absolute inset-0 z-0">
        <ZenithRadar 
          objects={filteredObjects} 
          onSelectObject={(obj) => {
            setSelectedObject(obj);
          }}
          selectedObjectId={selectedObject?.id}
        />
      </div>

      {/* === TOP BAR (floating overlay) === */}
      <div className={`relative z-20 transition-opacity duration-300 ${isFullscreen ? "opacity-0 hover:opacity-100" : ""}`}>
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Location + Status */}
          <div className="flex items-center gap-4">
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 px-4 py-2 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-white/70">
                {lat.toFixed(4)}°, {lng.toFixed(4)}°
              </span>
            </div>
            {utcTime && (
              <div className="bg-black/70 backdrop-blur-xl border border-white/10 px-4 py-2 flex items-center gap-3">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono text-white/70">
                  {format(utcTime, "HH:mm:ss")} UTC
                </span>
              </div>
            )}
            {loading && (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            )}
          </div>

          {/* Center: Filter Pills */}
          <FilterPanel filters={filters} onToggle={toggleFilter} />

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className={`p-2.5 border transition-all ${drawerOpen ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300" : "bg-black/70 backdrop-blur-xl border-white/10 text-white/70 hover:text-white hover:border-white/30"}`}
              title="Object List (L)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchScanData()}
              disabled={loading}
              className="p-2.5 bg-black/70 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-black/70 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-all"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* === ZENITH ALERTS (toast notifications) === */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {zenithAlerts.map((alert, i) => (
          <div
            key={`${alert}-${i}`}
            className="bg-cyan-500/20 backdrop-blur-xl border border-cyan-400/50 px-6 py-3 text-cyan-200 text-sm font-heading tracking-widest uppercase animate-in fade-in slide-in-from-top-4 duration-500 flex items-center gap-3"
          >
            <Crosshair className="w-4 h-4 animate-pulse" />
            {alert}
          </div>
        ))}
      </div>

      {/* === OBJECT DRAWER (slide-out from right) === */}
      <ObjectList
        objects={filteredObjects}
        onSelectObject={setSelectedObject}
        selectedObjectId={selectedObject?.id}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* === OBJECT DETAILS (floating bottom-left card) === */}
      <ObjectDetails 
        object={selectedObject} 
        onClose={() => setSelectedObject(null)} 
      />

      {/* === BOTTOM STATS BAR === */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 pointer-events-none transition-opacity duration-300 ${isFullscreen ? "opacity-0 hover:opacity-100" : ""}`}>
        <div className="flex items-center justify-between px-6 pt-4 pb-10 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Satellite className="w-3.5 h-3.5 text-white/50" />
              <span className="text-[11px] font-mono text-white/50">
                <span className="text-white font-bold">{totalObjects}</span> TRACKED
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-white/50" />
              <span className="text-[11px] font-mono text-white/50">
                <span className="text-green-400 font-bold">{visibleObjects}</span> VISIBLE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-white/50" />
              <span className="text-[11px] font-mono text-white/50">
                <span className="text-cyan-400 font-bold">{zenithObjects}</span> ZENITH
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-white/30 tracking-wider">
            F: FULLSCREEN · L: LIST · ↑↓: CYCLE · ESC: DESELECT
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loader />}>
      <DashboardContent />
    </Suspense>
  );
}
