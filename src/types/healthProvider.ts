/**
 * Health Provider Type Definitions
 * Stores personal/private healthcare provider data per user.
 * Data never shared between users — private Firestore subcollection only.
 */

export type ProviderCategory =
  | 'doctor'
  | 'clinic'
  | 'hospital'
  | 'lab'
  | 'pharmacy'
  | 'dentist'
  | 'other';

export interface HealthProvider {
  id: string;
  userId: string;

  // Identity
  name: string;
  category: ProviderCategory;
  specialty?: string;
  doctorName?: string;
  document?: string; // CNPJ, CPF, NIF, etc.

  // Contact
  phone?: string;
  whatsapp?: string;
  bookingUrl?: string;
  website?: string;

  // Location
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
  osmId?: string;       // OpenStreetMap node/way ID for deduplication
  lat?: number;
  lng?: number;

  // User metadata
  notes?: string;
  isFavorite: boolean;
  tags?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/** Lightweight result shape returned by OSM search before saving */
export interface OsmSearchResult {
  osmId: string;
  osmType: 'node' | 'way' | 'relation';
  name: string;
  category: ProviderCategory;
  address?: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
}

/** Maps OSM amenity tags → ProviderCategory */
export const OSM_AMENITY_TO_CATEGORY: Record<string, ProviderCategory> = {
  hospital: 'hospital',
  clinic: 'clinic',
  doctors: 'doctor',
  laboratory: 'lab',
  pharmacy: 'pharmacy',
  dentist: 'dentist',
  healthcare: 'other',
};

/** Maps ProviderCategory → OSM amenity tags for Overpass queries */
export const CATEGORY_TO_OSM_AMENITY: Record<ProviderCategory, string[]> = {
  hospital:  ['hospital'],
  clinic:    ['clinic'],
  doctor:    ['doctors'],
  lab:       ['laboratory'],
  pharmacy:  ['pharmacy'],
  dentist:   ['dentist'],
  other:     ['healthcare'],
};

/** Human-readable labels for each category (pt-BR) */
export const PROVIDER_CATEGORY_LABELS: Record<ProviderCategory, string> = {
  hospital:  'Hospital',
  clinic:    'Clínica',
  doctor:    'Médico / Consultório',
  lab:       'Laboratório',
  pharmacy:  'Farmácia',
  dentist:   'Dentista',
  other:     'Outro',
};

/** Phosphor icon name per category */
export const PROVIDER_CATEGORY_ICONS: Record<ProviderCategory, string> = {
  hospital:  'Hospital',
  clinic:    'Stethoscope',
  doctor:    'UserMd',
  lab:       'Flask',
  pharmacy:  'Pill',
  dentist:   'Tooth',
  other:     'FirstAid',
};

export function createEmptyProvider(userId: string): Omit<HealthProvider, 'id'> {
  return {
    userId,
    name: '',
    category: 'clinic',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function osmResultToProvider(
  result: OsmSearchResult,
  userId: string
): Omit<HealthProvider, 'id'> {
  return {
    userId,
    name: result.name,
    category: result.category,
    address: result.address,
    city: result.city,
    state: result.state,
    lat: result.lat,
    lng: result.lng,
    osmId: result.osmId,
    phone: result.phone,
    website: result.website,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
