import { CONTINENTS, type Continent, type Ring } from '../content/world';

/** Even-odd rule in longitude/latitude (rings never cross the 180° line). */
export function inRing(ring: Ring, lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function continentAt(lon: number, lat: number): Continent | null {
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return CONTINENTS.find((c) => c.rings.some((r) => inRing(r, lon, lat))) ?? null;
}

const RAD = Math.PI / 180;

/**
 * Orthographic view of the globe. A point on the disc (x, y in −1…1, y up) seen with the globe
 * turned to longitude `lon0` and tilted to latitude `lat0` → its longitude and latitude.
 */
export function unproject(x: number, y: number, lon0: number, lat0: number): [number, number] | null {
  const rr = x * x + y * y;
  if (rr > 1) return null;
  const z = Math.sqrt(1 - rr);
  const s = Math.sin(lat0 * RAD);
  const c = Math.cos(lat0 * RAD);
  const lat = Math.asin(Math.max(-1, Math.min(1, z * s + y * c))) / RAD;
  const lon = lon0 + Math.atan2(x, z * c - y * s) / RAD;
  return [((((lon + 180) % 360) + 360) % 360) - 180, lat];
}

/** Shortest turn from one longitude to another, in degrees (−180…180). */
export const lonDelta = (from: number, to: number): number => ((((to - from + 180) % 360) + 360) % 360) - 180;
