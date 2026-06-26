"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import CoordinateInput, { GpsStatus } from "@/components/CoordinateInput";

// Dynamically import the map to avoid SSR issues with Mapbox
const Zenith3DMap = dynamic(() => import("@/components/Zenith3DMap"), { 
  ssr: false,
  loading: () => <div className="h-[600px] w-full border border-white/20 bg-space-grey/50 animate-pulse flex items-center justify-center font-heading text-white tracking-widest text-sm">INITIALIZING 3D CARTOGRAPHY...</div>
});

const LAST_LOCATION_KEY = "project-zenith:last-location";

type SavedLocation = {
  latitude: number;
  longitude: number;
};

const isValidCoordinate = (latitude: number, longitude: number) => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const getLocationErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was denied. You can still choose a point manually.";
    case error.POSITION_UNAVAILABLE:
      return "Current location is unavailable. Try again or select coordinates manually.";
    case error.TIMEOUT:
      return "GPS lookup timed out. Using the last known or selected point.";
    default:
      return "Unable to read your current location.";
  }
};

export default function LocationPage() {
  const router = useRouter();
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [hasLocation, setHasLocation] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const autoRequestedRef = useRef(false);

  const saveLocation = useCallback((latitude: number, longitude: number) => {
    try {
      localStorage.setItem(
        LAST_LOCATION_KEY,
        JSON.stringify({ latitude, longitude } satisfies SavedLocation)
      );
    } catch {
      // Storage failures should not block selecting a location.
    }
  }, []);

  const handleLocationSelect = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setHasLocation(true);
    setGpsError(null);
    saveLocation(newLat, newLng);
  }, [saveLocation]);

  const requestCurrentLocation = useCallback((mode: "auto" | "manual") => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }

    setGpsStatus("locating");
    setGpsError(null);

    const options: PositionOptions = mode === "manual"
      ? { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // Force true hardware GPS
      : { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 };

    navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLat = position.coords.latitude;
          const nextLng = position.coords.longitude;
          setLat(nextLat);
          setLng(nextLng);
          setHasLocation(true);
          setGpsStatus("located");
          setGpsError(null);
          saveLocation(nextLat, nextLng);
        },
        (error) => {
          console.warn("Geolocation warning: " + error.message);
          setGpsStatus("error");
          setGpsError(getLocationErrorMessage(error));
        },
        options
      );
  }, [saveLocation]);

  const handleUseCurrentLocation = useCallback(() => {
    if (gpsStatus === "locating") return;
    requestCurrentLocation("manual");
  }, [gpsStatus, requestCurrentLocation]);

  useEffect(() => {
    if (autoRequestedRef.current) return;
    autoRequestedRef.current = true;

    let savedLocation: SavedLocation | null = null;
    try {
      const saved = localStorage.getItem(LAST_LOCATION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedLocation;
        if (isValidCoordinate(parsed.latitude, parsed.longitude)) {
          savedLocation = parsed;
        }
      }
    } catch {
      localStorage.removeItem(LAST_LOCATION_KEY);
    }

    const startupLocationTimer = window.setTimeout(() => {
      if (savedLocation) {
        setLat(savedLocation.latitude);
        setLng(savedLocation.longitude);
        setHasLocation(true);
        setGpsStatus("using_saved");
      }

      requestCurrentLocation("auto");
    }, 0);

    return () => window.clearTimeout(startupLocationTimer);
  }, [requestCurrentLocation]);

  const handleScanZenith = () => {
    if (!hasLocation) {
      alert("Please select a location first.");
      return;
    }
    router.push(`/scanning?lat=${lat}&lng=${lng}`);
  };

  return (
    <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden flex flex-col">
      {/* Full-bleed Map Container */}
      <div className="absolute inset-0 z-0">
        <Zenith3DMap 
          onLocationSelect={handleLocationSelect} 
          initialLat={lat} 
          initialLng={lng} 
          hasLocation={hasLocation}
          locationStatus={gpsStatus}
        />
      </div>

      {/* Floating UI Overlay */}
      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col">
        <div className="max-w-7xl mx-auto px-6 pt-8 w-full">
          <div className="pointer-events-auto inline-block drop-shadow-2xl">
            <h1 className="text-4xl font-heading tracking-[0.3em] font-light text-white mb-2 uppercase drop-shadow-lg">
              Target <span className="font-bold">Acquisition</span>
            </h1>
            <p className="text-white/80 tracking-widest text-sm uppercase drop-shadow-md">Global Coordinates Uplink</p>
          </div>
        </div>

        {/* Floating Input Panel */}
        <div className="absolute top-8 right-6 w-full max-w-[400px] pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
            <CoordinateInput 
              lat={lat} 
              lng={lng} 
              onChange={handleLocationSelect} 
              onUseCurrentLocation={handleUseCurrentLocation} 
              gpsStatus={gpsStatus}
              gpsError={gpsError}
              hasLocation={hasLocation}
            />
            
            <button 
              onClick={handleScanZenith}
              className={`w-full mt-6 py-4 rounded-none border font-heading tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-3 ${
                !hasLocation 
                  ? "bg-transparent border-white/10 text-white/20 cursor-not-allowed"
                  : "bg-cyan-950/40 text-cyan-50 border-cyan-500/50 hover:bg-cyan-900/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:border-cyan-400"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><path d="M12 12h.01"/><path d="m13.61 10.39-1.61 1.61"/></svg>
              SCAN ZENITH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
