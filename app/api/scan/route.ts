import { NextResponse } from "next/server";
import { CelestialObject, ScanResult } from "@/lib/types/celestial";
import { getVisibilityStatus } from "@/lib/astronomy/zenithFilter";
import * as satellite from "satellite.js";
import { Equator, Horizon, Observer, Body, AstroTime } from "astronomy-engine";

// Fetch the 100 brightest visual satellites from CelesTrak
const CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");

  const timeUTC = new Date().toISOString();
  const currentDate = new Date();
  
  const celestialObjects: CelestialObject[] = [];

  // Helper function to calculate sub-stellar geographic coordinates (lat/lng)
  // for infinitely far objects based on observer's lat/lng, azimuth, and altitude.
  const calculateSubStellarPoint = (obsLat: number, obsLng: number, alt: number, az: number) => {
    // Distance in radians along the great circle (90 deg - altitude)
    const distanceRad = (90 - alt) * (Math.PI / 180);
    const bearingRad = az * (Math.PI / 180);
    const lat1 = obsLat * (Math.PI / 180);
    const lng1 = obsLng * (Math.PI / 180);

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceRad) +
      Math.cos(lat1) * Math.sin(distanceRad) * Math.cos(bearingRad)
    );

    const lng2 = lng1 + Math.atan2(
      Math.sin(bearingRad) * Math.sin(distanceRad) * Math.cos(lat1),
      Math.cos(distanceRad) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      lat: lat2 * (180 / Math.PI),
      lng: lng2 * (180 / Math.PI)
    };
  };

  // --- 1. PLANETS AND STARS (Astronomy Engine) ---
  try {
    const observer = new Observer(lat, lng, 0);
    const time = new AstroTime(currentDate);

    // Major Planets
    const planets = [
      { name: "Mercury", body: Body.Mercury },
      { name: "Venus", body: Body.Venus },
      { name: "Mars", body: Body.Mars },
      { name: "Jupiter", body: Body.Jupiter },
      { name: "Saturn", body: Body.Saturn },
    ];

    for (const p of planets) {
      const equ = Equator(p.body, time, observer, true, true);
      const hor = Horizon(time, observer, equ.ra, equ.dec, "normal");
      
      if (hor.altitude >= 0) {
        const subPoint = calculateSubStellarPoint(lat, lng, hor.altitude, hor.azimuth);
        
        celestialObjects.push({
          id: `planet-${p.name.toLowerCase()}`,
          name: p.name,
          type: "Planet",
          altitude: hor.altitude,
          azimuth: hor.azimuth,
          latitude: subPoint.lat,
          longitude: subPoint.lng,
          distanceKm: 0, // Planets are too far for this scale
          visibilityStatus: getVisibilityStatus(hor.altitude),
          source: "Astronomy Engine (Live)",
          lastUpdated: timeUTC,
        });
      }
    }

    // Major Constellations (Hardcoded RA/Dec approximate centers)
    const constellations = [
      { name: "Orion", ra: 5.5, dec: 5.0 }, 
      { name: "Ursa Major", ra: 11.0, dec: 50.0 },
      { name: "Scorpius", ra: 16.5, dec: -30.0 },
      { name: "Cassiopeia", ra: 1.0, dec: 60.0 },
      { name: "Crux", ra: 12.5, dec: -60.0 },
    ];

    for (const c of constellations) {
      const hor = Horizon(time, observer, c.ra, c.dec, "normal");
      if (hor.altitude >= 0) {
        const subPoint = calculateSubStellarPoint(lat, lng, hor.altitude, hor.azimuth);
        
        celestialObjects.push({
          id: `const-${c.name.toLowerCase().replace(" ", "-")}`,
          name: c.name,
          type: "Constellation",
          altitude: hor.altitude,
          azimuth: hor.azimuth,
          latitude: subPoint.lat,
          longitude: subPoint.lng,
          distanceKm: 0,
          visibilityStatus: getVisibilityStatus(hor.altitude),
          source: "Astronomy Engine (Live)",
          lastUpdated: timeUTC,
        });
      }
    }
  } catch (err) {
    console.error("Astronomy Engine Error:", err);
  }

  // --- 2. SATELLITES (CelesTrak) ---
  try {
    const response = await fetch(CELESTRAK_URL, { next: { revalidate: 300 } }); // Cache for 5 mins
    if (!response.ok) {
      throw new Error("Failed to fetch from CelesTrak");
    }

    const tleText = await response.text();
    const lines = tleText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    const satellites: CelestialObject[] = [];

    // TLEs come in blocks of 3 lines: Name, Line 1, Line 2
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break;

      const name = lines[i];
      const tleLine1 = lines[i + 1];
      const tleLine2 = lines[i + 2];

      try {
        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
        
        // --- 1. Calculate CURRENT state ---
        const positionAndVelocity = satellite.propagate(satrec, currentDate);
        if (!positionAndVelocity || !positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
          continue;
        }

        const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
        const gmst = satellite.gstime(currentDate);

        const observerGd = {
          longitude: satellite.degreesToRadians(lng),
          latitude: satellite.degreesToRadians(lat),
          height: 0 
        };

        const positionEcf = satellite.eciToEcf(positionEci, gmst);
        const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

        const altitudeDeg = satellite.radiansToDegrees(lookAngles.elevation);
        const azimuthDeg = satellite.radiansToDegrees(lookAngles.azimuth);
        
        // --- 2. Calculate PREDICTIVE state (Next 12 Hours) ---
        let zenithETA: string | undefined = undefined;
        
        // Optimization: Only run prediction if it's currently visible or likely to pass over.
        // We will step forward in time by 1 minute for the next 12 hours (720 minutes).
        for (let minOffset = 0; minOffset <= 720; minOffset++) {
          const futureDate = new Date(currentDate.getTime() + minOffset * 60000);
          const futurePv = satellite.propagate(satrec, futureDate);
          if (futurePv && futurePv.position && typeof futurePv.position !== 'boolean') {
            const fGmst = satellite.gstime(futureDate);
            const fEcf = satellite.eciToEcf(futurePv.position as satellite.EciVec3<number>, fGmst);
            const fLook = satellite.ecfToLookAngles(observerGd, fEcf);
            const fAlt = satellite.radiansToDegrees(fLook.elevation);
            
            if (fAlt >= 80) {
              zenithETA = futureDate.toISOString();
              break; // Found the earliest Zenith pass!
            }
          }
        }

        // --- 3. Filtering ---
        // Only keep if currently visible (alt >= 0) OR if it is destined for Zenith!
        if (altitudeDeg < 0 && !zenithETA) continue;

        const rangeKm = lookAngles.rangeSat;

        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const satLat = satellite.radiansToDegrees(positionGd.latitude);
        const satLng = satellite.radiansToDegrees(positionGd.longitude);

        const type = name.toUpperCase().includes("ISS") ? "ISS" : "Satellite";

        satellites.push({
          id: `sat-${tleLine2.substring(2, 7).trim()}`,
          name: name,
          type: type,
          altitude: altitudeDeg,
          azimuth: azimuthDeg,
          latitude: satLat,
          longitude: satLng,
          distanceKm: rangeKm,
          orbitalHeightKm: positionGd.height,
          visibilityStatus: getVisibilityStatus(altitudeDeg),
          source: "CelesTrak (Live)",
          lastUpdated: timeUTC,
          tleLine1: tleLine1,
          tleLine2: tleLine2,
          zenithETA: zenithETA, // Include prediction
        });

      } catch (e) {
        // Skip invalid TLE
      }
    }

    // Deduplicate satellites by ID (CelesTrak often provides multiple TLEs for the same object)
    const uniqueSatellitesMap = new Map<string, CelestialObject>();
    for (const sat of satellites) {
      // If duplicate exists, you can optionally compare epochs, but taking the first is usually fine 
      // as they are ordered sequentially in the CelesTrak file.
      if (!uniqueSatellitesMap.has(sat.id)) {
        uniqueSatellitesMap.set(sat.id, sat);
      }
    }
    const uniqueSatellites = Array.from(uniqueSatellitesMap.values());

    // Sort satellites by altitude
    uniqueSatellites.sort((a, b) => b.altitude - a.altitude);
    
    // Do not slice to 40! Slicing causes satellites near the cutoff rank to constantly 
    // mount/unmount in React as their altitudes fluctuate, destroying camera tracking.
    celestialObjects.push(...uniqueSatellites);

  } catch (error) {
    console.error("API Error (Satellites):", error);
  }

  // --- 3. MERGE & RETURN ---
  const nearZenithObjects = celestialObjects.filter(obj => obj.altitude >= 80);

  const result: ScanResult = {
    observer: {
      latitude: lat,
      longitude: lng,
      timeUTC,
    },
    summary: {
      totalObjects: celestialObjects.length, 
      visibleObjects: celestialObjects.length,
      nearZenithObjects: nearZenithObjects.length,
    },
    objects: celestialObjects,
  };

  return NextResponse.json(result);
}
