import { degToRad } from "./coordinates";

export const getRadarCoordinates = (
  altitude: number,
  azimuth: number,
  maxRadius: number
): { x: number; y: number } => {
  if (altitude < 0) {
    // Return something outside the radar if it's below horizon
    return { x: -9999, y: -9999 };
  }

  // Radius formula: maxRadius * (1 - altitude / 90)
  // Higher altitude (e.g., 90) = closer to center (0)
  // Lower altitude (e.g., 0) = closer to edge (maxRadius)
  const radius = maxRadius * (1 - altitude / 90);

  // Azimuth is 0 at North, 90 at East. Standard mathematical angle is 0 at East.
  // Converting azimuth to radians and adjusting for SVG/Canvas orientation:
  // Usually, in a UI (like SVG), y goes down.
  // 0 degrees = North (up) -> x = 0, y = -radius
  // 90 degrees = East (right) -> x = radius, y = 0
  const azimuthRadians = degToRad(azimuth);
  
  const x = radius * Math.sin(azimuthRadians);
  const y = -radius * Math.cos(azimuthRadians);

  return { x, y };
};
