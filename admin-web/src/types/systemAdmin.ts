import type { FieldResponse } from "./venue";

export type AdminRole = "USER" | "OWNER" | "STAFF" | "ADMIN";
export interface AdminPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface AdminUser {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface AdminUserRequest {
  fullName: string;
  email: string | null;
  phone: string | null;
  password?: string;
  role: AdminRole;
  active: boolean;
}
export interface AdminVenue {
  id: number;
  name: string;
  address: string;
  city: string | null;
  district: string | null;
  description: string | null;
  imageUrl: string | null;
  phone: string | null;
  openingTime: string;
  closingTime: string;
  status: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  ownerDeleted: boolean;
  ownerActive: boolean;
  fieldCount: number;
  adminHidden: boolean;
  adminHiddenReason: string | null;
  adminHiddenAt: string | null;
}
export interface AdminVenueDetail extends AdminVenue { fields: FieldResponse[] }
export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  usersByRole: Record<string, number>;
  totalVenues: number;
  activeVenues: number;
  hiddenVenues: number;
  totalFields: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
}
