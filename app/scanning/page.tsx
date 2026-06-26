"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Crosshair, Satellite, Radar } from "lucide-react";
import Loader from "@/components/Loader";

const SCAN_LOGS = [
  "INITIALIZING ZENITH RADAR...",
  "ESTABLISHING SATELLITE UPLINK...",
  "QUERYING CELESTRAK ORBITAL DATABASE...",
  "TRIANGULATING POSITION...",
  "CALCULATING ALTITUDE & AZIMUTH...",
  "FILTERING HORIZON DATA...",
  "ACQUIRING TARGETS..."
];

function ScanningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lat = searchParams.get("lat") || "0";
  const lng = searchParams.get("lng") || "0";
  
  const [currentLog, setCurrentLog] = useState(0);

  useEffect(() => {
    // PRELOAD OPTIMIZATION:
    // Aggressively download the massive 5MB Cesium 3D engine in the background 
    // utilizing the user's hardware and bandwidth while they watch the 3.5s animation.
    // By the time they reach the dashboard, the engine is already parsed in memory!
    import("@/components/ZenithRadar");
    import("@/components/CesiumGlobe").catch(() => {});

    // Cycle through logs quickly
    const logInterval = setInterval(() => {
      setCurrentLog(prev => {
        if (prev < SCAN_LOGS.length - 1) return prev + 1;
        return prev;
      });
    }, 400);

    // Redirect to dashboard after 3 seconds
    const timeout = setTimeout(() => {
      router.replace(`/dashboard?lat=${lat}&lng=${lng}`);
    }, 3500);

    return () => {
      clearInterval(logInterval);
      clearTimeout(timeout);
    };
  }, [lat, lng, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-space-black overflow-hidden h-full">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Scanning Radar Graphic */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <Loader />

        {/* Coordinates being scanned */}
        <div className="mt-12 text-center">
          <div className="font-heading text-xl tracking-[0.3em] text-white mb-2">
            SCANNING SECTOR
          </div>
          <div className="font-mono text-cyan-400 text-sm tracking-widest bg-cyan-950/30 border border-cyan-500/20 px-6 py-2 rounded-full inline-block">
            {parseFloat(lat).toFixed(4)}°, {parseFloat(lng).toFixed(4)}°
          </div>
        </div>

        {/* Logs */}
        <div className="mt-16 h-12 flex items-center justify-center">
          <motion.div 
            key={currentLog}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="font-mono text-xs text-white/50 tracking-widest uppercase flex items-center gap-3"
          >
            <Satellite className="w-4 h-4 text-cyan-500/50" />
            {SCAN_LOGS[currentLog]}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function ScanningPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ScanningContent />
    </Suspense>
  );
}
