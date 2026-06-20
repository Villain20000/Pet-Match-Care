import { api } from './api';
import type {
  PetForAdoptionDto,
  PetFriendlySpotDto,
  PoisonAlertDto,
  StrayReportDto,
  MunicipalityDto,
} from '@/types';

export interface CreateReportInput {
  imageUrl: string;
  condition: StrayReportDto['condition'];
  description?: string;
  latitude: number;
  longitude: number;
  addressHint?: string;
}

export const reportsApi = {
  async create(input: CreateReportInput): Promise<StrayReportDto> {
    const res = await api.post<{ report: StrayReportDto }>('/reports', input);
    return res.data.report;
  },

  async nearby(lat: number, lng: number, radiusKm = 5): Promise<StrayReportDto[]> {
    const res = await api.get<{ reports: StrayReportDto[] }>('/reports/nearby', {
      params: { lat, lng, radius: radiusKm },
    });
    return res.data.reports;
  },
};

export interface CreatePoisonAlertInput extends CreateReportInput {
  severity?: PoisonAlertDto['severity'];
}

export const alertsApi = {
  async create(input: CreatePoisonAlertInput) {
    const res = await api.post('/alerts/poison', input);
    return res.data as {
      alert: PoisonAlertDto;
      geofence: { radiusKm: number; usersInRange: number; tokensNotified: number };
      push: { delivered: number; failed: number; dryRun: number };
    };
  },

  async activeNearby(
    lat: number,
    lng: number,
    radiusKm = 2,
  ): Promise<PoisonAlertDto[]> {
    const res = await api.get<{ alerts: PoisonAlertDto[] }>('/alerts/poison/active', {
      params: { lat, lng, radius: radiusKm },
    });
    return res.data.alerts;
  },
};

export const spotsApi = {
  async list(category?: string): Promise<PetFriendlySpotDto[]> {
    const res = await api.get<{ spots: PetFriendlySpotDto[] }>('/spots', {
      params: category ? { category } : undefined,
    });
    return res.data.spots;
  },

  async create(input: {
    name: string;
    category: PetFriendlySpotDto['category'];
    latitude: number;
    longitude: number;
    address?: string;
  }) {
    const res = await api.post('/spots', input);
    return res.data.spot as PetFriendlySpotDto;
  },

  async vote(spotId: string, value: 1 | -1) {
    const res = await api.post(`/spots/${spotId}/vote`, { value });
    return res.data.spot as PetFriendlySpotDto;
  },
};

export const adoptionApi = {
  async list(params?: {
    species?: 'DOG' | 'CAT';
    urgent?: boolean;
    q?: string;
  }): Promise<PetForAdoptionDto[]> {
    const res = await api.get<{ pets: PetForAdoptionDto[] }>('/adoption', {
      params,
    });
    return res.data.pets;
  },

  async get(id: string): Promise<PetForAdoptionDto> {
    const res = await api.get<{ pet: PetForAdoptionDto }>(`/adoption/${id}`);
    return res.data.pet;
  },

  async expressInterest(id: string) {
    const res = await api.post(`/adoption/${id}/interest`);
    return res.data;
  },
};

export const municipalitiesApi = {
  async list(): Promise<MunicipalityDto[]> {
    const res = await api.get<{ municipalities: MunicipalityDto[] }>('/municipalities');
    return res.data.municipalities;
  },

  async closest(lat: number, lng: number): Promise<MunicipalityDto> {
    const res = await api.get<MunicipalityDto>('/municipalities/closest', {
      params: { lat, lng },
    });
    return res.data;
  },
};

// ---------------------------------------------------------------------------
// Mock seed used while the backend isn't running. Lets the map feel alive
// during local development. The shapes match the real API so swapping is
// trivial.
// ---------------------------------------------------------------------------
import { Colors } from '@/theme';

export const MOCK_SPOTS: PetFriendlySpotDto[] = [
  {
    id: 'mock-1',
    creatorId: 'demo',
    name: 'Καφενείο "Ο Αυλός"',
    category: 'CAFE',
    latitude: 37.9842,
    longitude: 23.7351,
    address: 'Πλάκα, Αθήνα',
    upvotes: 12,
    downvotes: 0,
    isVerified: true,
    isFlagged: false,
    flagReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'mock-2',
    creatorId: 'demo',
    name: 'Πάρκο Αντώνης Τρίτσης',
    category: 'PARK',
    latitude: 38.0058,
    longitude: 23.7089,
    address: 'Περιστέρι, Αθήνα',
    upvotes: 9,
    downvotes: 1,
    isVerified: true,
    isFlagged: false,
    flagReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'mock-3',
    creatorId: 'demo',
    name: 'Κτηνιατρείο CareVet',
    category: 'VET',
    latitude: 37.9755,
    longitude: 23.7348,
    address: 'Εξάρχεια, Αθήνα',
    upvotes: 6,
    downvotes: 0,
    isVerified: true,
    isFlagged: false,
    flagReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 'mock-4',
    creatorId: 'demo',
    name: 'Pet-friendly Loft',
    category: 'APARTMENT',
    latitude: 38.0123,
    longitude: 23.7701,
    address: 'Κυψέλη, Αθήνα',
    upvotes: 3,
    downvotes: 0,
    isVerified: true,
    isFlagged: false,
    flagReason: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const SPOT_PIN_COLORS: Record<string, string> = {
  CAFE: Colors.terracotta,
  PARK: Colors.sage,
  VET: Colors.charcoal,
  APARTMENT: Colors.crimsonSoft,
};
