// Khớp VenueResponse của backend
export interface VenueResponse {
  id: number;
  ownerId: number;
  name: string;
  address: string;
  city: string;
  district: string;
  description: string;
  phone: string;
  openingTime: string; // HH:mm:ss
  closingTime: string; // HH:mm:ss
  status: "ACTIVE" | "INACTIVE" | string;
  createdAt: string;
  updatedAt: string;
}

// Khớp CreateVenueRequest / UpdateVenueRequest của backend (POST / PUT /api/owner/venues)
export interface CreateVenueRequest {
  name: string;
  address: string;
  city: string;
  district: string;
  description: string;
  phone: string;
  openingTime: string; // HH:mm
  closingTime: string; // HH:mm
}

export type UpdateVenueRequest = CreateVenueRequest;

export type VenueStatus = "ACTIVE" | "INACTIVE";

// Khớp VenueStatusRequest của backend (PATCH /api/owner/venues/{id}/status)
export interface VenueStatusRequest {
  status: VenueStatus;
}

export type SportType =
  | "FOOTBALL"
  | "BADMINTON"
  | "PICKLEBALL"
  | "TENNIS"
  | "BASKETBALL"
  | "VOLLEYBALL"
  | "TABLE_TENNIS"
  | "OTHER";

export type FieldStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

// Khớp FieldRequest của backend (POST / PUT /api/owner/venues/{venueId}/fields)
export interface FieldRequest {
  name: string;
  sportType: SportType | string;
  description?: string;
  imageUrl?: string;
  capacity?: number;
  basePrice: number;
}

export type CreateFieldRequest = FieldRequest;
export type UpdateFieldRequest = FieldRequest;

// Khớp FieldStatusRequest của backend (PATCH /api/owner/venues/{venueId}/fields/{fieldId}/status)
export interface FieldStatusRequest {
  status: FieldStatus;
}

// Khớp FieldResponse của backend (/api/owner/venues/{venueId}/fields)
export interface FieldResponse {
  id: number;
  venueId: number;
  name: string;
  sportType: SportType | string;
  description?: string;
  imageUrl?: string;
  capacity?: number;
  basePrice: number;
  status: FieldStatus | string;
  createdAt: string;
  updatedAt: string;
}
