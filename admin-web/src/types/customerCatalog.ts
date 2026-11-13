import type { PolicyResponse } from "./policy";

export interface PublicVenue {
  id: number;
  name: string;
  address: string;
  city: string | null;
  district: string | null;
  phone: string | null;
  openingTime: string;
  closingTime: string;
  imageUrl: string | null;
  sportTypes: string[];
  fieldCount: number;
  minBasePrice: number | null;
}

export interface PublicField {
  id: number;
  name: string;
  sportType: string;
  description: string | null;
  capacity: number | null;
  basePrice: number;
  status: string;
}

export interface PublicVenueDetail extends Omit<PublicVenue, "sportTypes" | "fieldCount" | "minBasePrice"> {
  description: string | null;
  fields: PublicField[];
  policy: PolicyResponse | null;
}

export interface VenueSearch {
  keyword?: string;
  city?: string;
  district?: string;
  sportType?: string;
  page?: number;
  size?: number;
}
