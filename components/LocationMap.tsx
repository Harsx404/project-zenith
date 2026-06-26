"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
// @ts-ignore
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import L from "leaflet";

// Fix Leaflet marker icons in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  onUseCurrentLocation?: () => void;
}

function MapEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function SearchField({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!map) return;
    
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Search for a city or address...",
    });

    map.addControl(searchControl);

    const handleLocationFound = (e: any) => {
      if (e && e.location) {
        onSelectRef.current(e.location.y, e.location.x);
      }
    };

    map.on("geosearch/showlocation", handleLocationFound);

    return () => {
      try {
        map.removeControl(searchControl);
        map.off("geosearch/showlocation", handleLocationFound);
      } catch (err) {
        console.warn("Error removing geosearch control:", err);
      }
    };
  }, [map]);

  return null;
}

function UpdateMapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], 10, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationMap({ onLocationSelect, initialLat = 0, initialLng = 0, onUseCurrentLocation }: LocationMapProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  useEffect(() => {
    setPosition([initialLat, initialLng]);
  }, [initialLat, initialLng]);

  const handleSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative z-0">
      <MapContainer 
        center={position[0] !== 0 ? position : [20, 0]} 
        zoom={position[0] !== 0 ? 10 : 2} 
        style={{ height: "100%", width: "100%", background: "#e5e5e5" }}
        className="z-0"
      >
        {/* CartoDB Dark Matter: Sleek dark map that fits the space theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {position[0] !== 0 && position[1] !== 0 && (
          <Marker position={position} icon={customIcon} />
        )}
        <MapEvents onSelect={handleSelect} />
        <SearchField onSelect={handleSelect} />
        <UpdateMapCenter lat={position[0]} lng={position[1]} />
      </MapContainer>

      {onUseCurrentLocation && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onUseCurrentLocation();
          }}
          className="absolute bottom-6 right-4 z-[1000] bg-white text-slate-800 p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          title="My Location"
        >
          <LocateFixed className="w-5 h-5 text-blue-500" />
        </button>
      )}

      <style jsx global>{`
        /* Style adjustments for leaflet-geosearch to fit deep space theme */
        .leaflet-control-geosearch form {
          background: rgba(17, 20, 29, 0.8) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 0 !important;
          padding: 2px !important;
        }
        .leaflet-control-geosearch form input {
          color: white !important;
          font-family: inherit !important;
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
        }
        .leaflet-control-geosearch form input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .leaflet-control-geosearch form input:focus {
          outline: none !important;
        }
        .leaflet-control-geosearch .results.active {
          border-radius: 0 !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          background: rgba(17, 20, 29, 0.95) !important;
          backdrop-filter: blur(8px) !important;
        }
        .leaflet-control-geosearch .results > * {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.8) !important;
        }
        .leaflet-control-geosearch .results > *:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
