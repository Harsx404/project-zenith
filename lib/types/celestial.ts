export type CelestialObject = {
  id: string;
  name: string;
  type: "ISS" | "Satellite" | "Planet" | "Constellation";
  altitude: number;
  azimuth: number;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  orbitalHeightKm?: number;
  visibilityStatus: "Below Horizon" | "Visible" | "Near Zenith";
  source: string;
  lastUpdated: string;
  tleLine1?: string;
  tleLine2?: string;
  zenithETA?: string;
};

export type ObserverLocation = {
  latitude: number;
  longitude: number;
  timeUTC: string;
};

export type ScanResult = {
  observer: ObserverLocation;
  summary: {
    totalObjects: number;
    visibleObjects: number;
    nearZenithObjects: number;
  };
  objects: CelestialObject[];
};
