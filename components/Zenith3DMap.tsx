"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { format } from "date-fns";
import { MapPin, Clock } from "lucide-react";
import type { GpsStatus } from "./CoordinateInput";

interface Zenith3DMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  hasLocation?: boolean;
  locationStatus?: GpsStatus;
}

const FALLBACK_CENTER = {
  lat: 40.7128,
  lng: -74.006,
};

const TARGET_SOURCE_ID = "zenith-target-source";
const TARGET_HALO_LAYER_ID = "zenith-target-halo";
const TARGET_MARKER_LAYER_ID = "zenith-target-marker";
const TARGET_IMAGE_ID = "zenith-target-triangle";

const emptyTargetData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: [],
};

const createTargetData = (lat: number, lng: number): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
    },
  ],
});

const createTargetMarkerImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;

  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(canvas.width, canvas.height);

  // Solid red triangle pointing RIGHT
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.moveTo(12, 12);
  ctx.lineTo(40, 24);
  ctx.lineTo(12, 36);
  ctx.closePath();
  ctx.fill();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const ensureTargetMarkerLayer = (mapInstance: mapboxgl.Map) => {
  if (!mapInstance.isStyleLoaded()) return false;

  if (!mapInstance.hasImage(TARGET_IMAGE_ID)) {
    mapInstance.addImage(TARGET_IMAGE_ID, createTargetMarkerImage(), { pixelRatio: 2 });
  }

  if (!mapInstance.getSource(TARGET_SOURCE_ID)) {
    mapInstance.addSource(TARGET_SOURCE_ID, {
      type: "geojson",
      data: emptyTargetData,
    });
  }

  if (!mapInstance.getLayer(TARGET_MARKER_LAYER_ID)) {
    mapInstance.addLayer({
      id: TARGET_MARKER_LAYER_ID,
      type: "symbol",
      source: TARGET_SOURCE_ID,
      layout: {
        "icon-image": TARGET_IMAGE_ID,
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 0.6,
          22, 1.5
        ],
        "icon-anchor": "center",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-rotation-alignment": "viewport",
        "icon-pitch-alignment": "viewport",
      },
    });
  }

  return true;
};

export default function Zenith3DMap({
  onLocationSelect,
  initialLat = FALLBACK_CENTER.lat,
  initialLng = FALLBACK_CENTER.lng,
  hasLocation = initialLat !== 0 || initialLng !== 0,
  locationStatus = "idle",
}: Zenith3DMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const pendingTargetRef = useRef<{ lat: number; lng: number } | null>(null);
  
  const [time, setTime] = useState(new Date());
  const [mapError, setMapError] = useState<string | null>(null);
  const initialCenter = useRef<[number, number]>(
    hasLocation
      ? [initialLng, initialLat]
      : [FALLBACK_CENTER.lng, FALLBACK_CENTER.lat]
  );
  const initialTarget = useRef({
    hasLocation,
    lat: initialLat,
    lng: initialLng,
  });
  const displayLat = hasLocation ? initialLat : null;
  const displayLng = hasLocation ? initialLng : null;

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Real-time clock for the floating card
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const syncMarkerToLocation = useCallback((nextLat: number, nextLng: number, animate = true) => {
    if (!map.current) return;

    pendingTargetRef.current = { lat: nextLat, lng: nextLng };

    if (ensureTargetMarkerLayer(map.current)) {
      const source = map.current.getSource(TARGET_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      source?.setData(createTargetData(nextLat, nextLng));
    }

    map.current.easeTo({
      center: [nextLng, nextLat],
      zoom: Math.max(map.current.getZoom(), 18),
      duration: animate ? 400 : 0,
      pitch: 60,
    });
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    if (map.current) return; // Initialize map only once

    try {
      const isMobile = window.innerWidth < 768;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: initialCenter.current,
        zoom: initialTarget.current.hasLocation ? (isMobile ? 14 : 16) : (isMobile ? 1.5 : 3),
        pitch: 60,
        bearing: -25,
        antialias: true,
      });

      map.current.on("error", (e) => {
        console.error("Mapbox GL JS error:", e);
        if (e.error?.message?.includes("Unauthorized")) {
          setMapError("Invalid Mapbox Token. Please check your .env.local file.");
        }
      });

      map.current.on("style.load", () => {
        // Insert the layer beneath any symbol layer.
        const layers = map.current?.getStyle()?.layers;
        let labelLayerId: string | undefined;
        if (layers) {
          for (let i = 0; i < layers.length; i++) {
            const layout = layers[i].layout as Record<string, unknown> | undefined;
            if (layers[i].type === "symbol" && layout?.["text-field"]) {
              labelLayerId = layers[i].id;
              break;
            }
          }
        }

        // Add 3D building extrusions
        map.current?.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["get", "height"],
                0, "#0f172a", // Very dark blue for low buildings
                200, "#334155" // Lighter slate for tall buildings
              ],
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.8,
            },
          },
          labelLayerId
        );

        if (map.current && ensureTargetMarkerLayer(map.current) && pendingTargetRef.current) {
          const source = map.current.getSource(TARGET_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
          source?.setData(createTargetData(pendingTargetRef.current.lat, pendingTargetRef.current.lng));
        }
      });

      if (initialTarget.current.hasLocation) {
        syncMarkerToLocation(initialTarget.current.lat, initialTarget.current.lng, false);
      }

      // Map click handler
      map.current.on("click", (e) => {
        const clickedLat = e.lngLat.lat;
        const clickedLng = e.lngLat.lng;
        
        syncMarkerToLocation(clickedLat, clickedLng);

        onLocationSelectRef.current(clickedLat, clickedLng);
      });
    } catch (err) {
      console.error("Failed to initialize Mapbox:", err);
      window.setTimeout(() => {
        setMapError("Failed to initialize WebGL map.");
      }, 0);
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [syncMarkerToLocation]);

  useEffect(() => {
    if (!hasLocation) return;
    syncMarkerToLocation(initialLat, initialLng);
  }, [hasLocation, initialLat, initialLng, syncMarkerToLocation]);

  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const locationLabel = {
    idle: "NO TARGET LOCK",
    locating: "GPS LOCKING",
    located: "GPS TARGET",
    error: hasLocation ? "TARGET LOCKED" : "NO TARGET LOCK",
    using_saved: "SAVED TARGET",
  }[locationStatus];

  if (!hasToken) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center border border-white/20 bg-space-grey/80 p-8 text-center relative z-0">
        <div className="max-w-md">
          <h2 className="text-xl font-heading text-red-400 mb-4 tracking-widest font-bold">MAPBOX TOKEN REQUIRED</h2>
          <p className="text-white/70 mb-4">
            To view the premium 3D city map, please add your Mapbox token to the environment variables.
          </p>
          <code className="block bg-black/50 p-4 rounded text-sm text-left font-mono border border-white/10 break-words text-white/50">
            NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full border-t border-white/10 overflow-hidden group bg-space-black">
      {mapError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-8 text-center">
          <p className="text-red-400 font-heading tracking-widest font-bold text-lg">{mapError}</p>
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
      
      {/* Floating Coordinate Card */}
      <div className="hidden md:block absolute bottom-10 left-6 z-10 bg-black/40 text-white p-5 shadow-2xl border border-white/10 backdrop-blur-xl min-w-[250px] transition-transform duration-500 ease-out group-hover:scale-105 origin-bottom-left pointer-events-none">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <h3 className="text-[10px] font-heading font-bold tracking-[0.3em] uppercase text-white">{locationLabel}</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> LATITUDE
            </p>
            <p className="font-mono text-lg font-medium">
              {displayLat === null ? "--" : <>{displayLat.toFixed(6)}&deg;</>}
            </p>
          </div>
          
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> LONGITUDE
            </p>
            <p className="font-mono text-lg font-medium">
              {displayLng === null ? "--" : <>{displayLng.toFixed(6)}&deg;</>}
            </p>
          </div>
          
          <div className="pt-2 border-t border-white/10">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> UTC TIME
            </p>
            <p className="font-mono text-sm">{format(time, "HH:mm:ss")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
