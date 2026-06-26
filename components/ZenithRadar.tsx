"use client";

import dynamic from 'next/dynamic';
import { CelestialObject } from "@/lib/types/celestial";
import { useSearchParams } from "next/navigation";
import { ErrorBoundary } from "./ErrorBoundary";

// Dynamically import the Cesium component to avoid Next.js Server-Side Rendering errors
const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/90">
      <div className="text-white font-heading tracking-widest animate-pulse mb-4">INITIALIZING CESIUM ENGINE...</div>
      <div className="w-16 h-16 border-4 border-t-cyan-500 border-white/10 rounded-full animate-spin"></div>
    </div>
  )
});

interface ZenithRadarProps {
  objects: CelestialObject[];
  onSelectObject: (obj: CelestialObject) => void;
  selectedObjectId?: string;
}

export default function ZenithRadar({ objects, onSelectObject, selectedObjectId }: ZenithRadarProps) {
  const searchParams = useSearchParams();
  const observerLat = parseFloat(searchParams.get("lat") || "0");
  const observerLng = parseFloat(searchParams.get("lng") || "0");

  return (
    <div className="w-full h-full relative">
      <ErrorBoundary>
        <CesiumGlobe 
          objects={objects} 
          onSelectObject={onSelectObject} 
          selectedObjectId={selectedObjectId}
          observerLat={observerLat}
          observerLng={observerLng}
        />
      </ErrorBoundary>
    </div>
  );
}
