export interface VenueAssignment {
  venueId: number;
  venueName: string;
  assigned: boolean;
  assignedAt: string;
}

export interface StaffResponse {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  createdAt: string;
  venues: VenueAssignment[];
}

export interface StaffCreateRequest {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  venueIds: number[];
}

export interface StaffUpdateRequest {
  fullName: string;
  email?: string;
  phone?: string;
}

export interface StaffStatusRequest {
  active: boolean;
}

export interface StaffVenuesRequest {
  venueIds: number[];
}

export interface ResetStaffPasswordRequest {
  newPassword: string;
}

