import { CelestialObject } from "../types/celestial";

export const getVisibilityStatus = (
  altitude: number
): "Below Horizon" | "Visible" | "Near Zenith" => {
  if (altitude < 0) return "Below Horizon";
  if (altitude >= 80) return "Near Zenith";
  return "Visible";
};

export const zenithFilter = (
  objects: CelestialObject[],
  minAltitude: number = 80
): CelestialObject[] => {
  return objects.filter((obj) => obj.altitude >= minAltitude);
};
