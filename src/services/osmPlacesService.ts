/**
 * OSM Places Service
 * Free, no-API-key required search for health providers.
 *
 * Sources:
 *  - Nominatim (text search): https://nominatim.openstreetmap.org
 *  - Overpass API (nearby search): https://overpass-api.de
 *
 * Usage policy compliance:
 *  - Max 1 req/s on Nominatim (enforced by debounce in UI)
 *  - User-Agent header identifies the app
 *  - Results cached in caller to avoid repeat fetches
 *  - Attribution: © OpenStreetMap contributors
 */

import type { OsmSearchResult, ProviderCategory } from '@/types/healthProvider';
import { CATEGORY_TO_OSM_AMENITY, OSM_AMENITY_TO_CATEGORY } from '@/types/healthProvider';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE  = 'https://overpass-api.de/api/interpreter';
const USER_AGENT     = 'HoraMed/1.0 (duvidas@horamed.net)';

const OSM_HEADERS = {
  'User-Agent': USER_AGENT,
  'Accept-Language': 'pt-BR,pt;q=0.9',
};

// ---------------------------------------------------------------------------
// Nominatim text search
// ---------------------------------------------------------------------------

interface NominatimResult {
  osm_id: string;
  osm_type: string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: {
    amenity?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  extratags?: {
    phone?: string;
    website?: string;
    healthcare?: string;
    amenity?: string;
  };
}

function resolveCategory(raw: NominatimResult): ProviderCategory {
  const amenity = raw.type ?? raw.extratags?.amenity ?? raw.class ?? '';
  return OSM_AMENITY_TO_CATEGORY[amenity] ?? 'other';
}

function nominatimToSearchResult(raw: NominatimResult): OsmSearchResult {
  // display_name format: "Name, road, suburb, city, state, country"
  const parts = raw.display_name.split(', ');
  const name   = parts[0] ?? raw.display_name;
  const city   = raw.address?.city ?? parts[parts.length - 3] ?? '';
  const state  = raw.address?.state ?? '';
  const road   = raw.address?.road ?? '';
  const suburb = raw.address?.suburb ?? '';
  const address = [road, suburb].filter(Boolean).join(', ');

  return {
    osmId:    `${raw.osm_type}/${raw.osm_id}`,
    osmType:  (raw.osm_type as 'node' | 'way' | 'relation') ?? 'node',
    name,
    category: resolveCategory(raw),
    address,
    city,
    state,
    lat:      parseFloat(raw.lat),
    lng:      parseFloat(raw.lon),
    phone:    raw.extratags?.phone,
    website:  raw.extratags?.website,
  };
}

/**
 * Search health providers by name/keyword using Nominatim.
 * Append "Brasil" to bias results to Brazil.
 */
export async function searchByText(
  query: string,
  limit = 6
): Promise<OsmSearchResult[]> {
  if (!query.trim()) return [];

  const biasedQuery = `${query.trim()} Brasil`;
  const params = new URLSearchParams({
    q:                  biasedQuery,
    format:             'jsonv2',
    limit:              String(limit),
    addressdetails:     '1',
    extratags:          '1',
    // Focus on health-related types
    featuretype:        'settlement',
  });

  // Additional filters via OSM tag keys for healthcare
  const searchUrl = `${NOMINATIM_BASE}/search?${params}&countrycodes=br&tag%5Bcategory%5D=health`;

  try {
    const res = await fetch(searchUrl, { headers: OSM_HEADERS });
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

    const data: NominatimResult[] = await res.json();
    return data.map(nominatimToSearchResult);
  } catch (err) {
    console.error('[OSMPlaces] searchByText failed:', err);
    return [];
  }
}

/**
 * Get details from a latitude/longitude point using Nominatim's reverse geocoding.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<OsmSearchResult | null> {
  const params = new URLSearchParams({
    lat:            String(lat),
    lon:            String(lng),
    format:         'jsonv2',
    addressdetails: '1',
    extratags:      '1',
  });

  const url = `${NOMINATIM_BASE}/reverse?${params}`;

  try {
    const res = await fetch(url, { headers: OSM_HEADERS });
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

    const data: NominatimResult = await res.json();
    if (!data.osm_id) return null;
    return nominatimToSearchResult(data);
  } catch (err) {
    console.error('[OSMPlaces] reverseGeocode failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Overpass API nearby search
// ---------------------------------------------------------------------------

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function overpassToSearchResult(el: OverpassElement): OsmSearchResult | null {
  const tags = el.tags ?? {};
  const lat  = el.lat ?? el.center?.lat;
  const lon  = el.lon ?? el.center?.lon;

  if (!lat || !lon) return null;

  const name = tags.name || tags['name:pt'] || 'Sem nome';
  const amenityTag = tags.amenity ?? tags.healthcare ?? '';
  const category: ProviderCategory = OSM_AMENITY_TO_CATEGORY[amenityTag] ?? 'other';

  const street  = tags['addr:street'] ?? '';
  const number  = tags['addr:housenumber'] ?? '';
  const address = [street, number].filter(Boolean).join(', ');

  return {
    osmId:    `${el.type}/${el.id}`,
    osmType:  el.type,
    name,
    category,
    address,
    city:    tags['addr:city'] ?? tags['addr:municipality'] ?? '',
    state:   tags['addr:state'] ?? '',
    lat,
    lng:     lon,
    phone:   tags.phone ?? tags['contact:phone'],
    website: tags.website ?? tags['contact:website'],
  };
}

function buildOverpassQuery(
  lat: number,
  lng: number,
  radius: number,
  amenities: string[]
): string {
  const aFilter = amenities
    .map(a => `node["amenity"="${a}"](around:${radius},${lat},${lng});\n  way["amenity"="${a}"](around:${radius},${lat},${lng});`)
    .join('\n  ');

  return `[out:json][timeout:10];\n(\n  ${aFilter}\n);\nout body center;`;
}

/**
 * Find health providers near GPS coordinates using Overpass API.
 */
export async function searchNearby(
  lat: number,
  lng: number,
  category: ProviderCategory,
  radiusMeters = 3000
): Promise<OsmSearchResult[]> {
  const amenities = CATEGORY_TO_OSM_AMENITY[category] ?? ['hospital', 'clinic', 'doctors'];
  const query     = buildOverpassQuery(lat, lng, radiusMeters, amenities);

  try {
    const res = await fetch(OVERPASS_BASE, {
      method:  'POST',
      headers: { ...OSM_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) throw new Error(`Overpass error: ${res.status}`);

    const data: { elements: OverpassElement[] } = await res.json();

    return data.elements
      .map(overpassToSearchResult)
      .filter((r): r is OsmSearchResult => r !== null && Boolean(r.name))
      .sort((a, b) => {
        // Sort by distance from user
        const da = Math.hypot(a.lat - lat, a.lng - lng);
        const db = Math.hypot(b.lat - lat, b.lng - lng);
        return da - db;
      })
      .slice(0, 10);
  } catch (err) {
    console.error('[OSMPlaces] searchNearby failed:', err);
    return [];
  }
}

/**
 * Calculates approximate distance in km between two coordinates.
 */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
