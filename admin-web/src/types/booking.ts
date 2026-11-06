export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface BookingResponse {
  id: number;
  bookingCode: string;
  fieldId: number;
  fieldName: string;
  sportType: string;
  venueId: number;
  venueName: string;
  venueAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  totalAmount: number;
  depositAmount: number;
  remainingAfterDeposit: number;
  status: BookingStatus;
  customerNote: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
}

export interface ManagerBookingResponse {
  booking: BookingResponse;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paidAmount: number;
  refundedAmount: number;
  pendingRefundAmount: number;
  outstandingAmount: number;
  cancelledByName: string | null;
}

export interface CancelResultResponse {
  booking: BookingResponse;
  paidAmount: number;
  refundAmount: number;
  forfeitedAmount: number;
  message: string;
}

export interface ManagerCancelRequest {
  reason: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface BookingFilterParams {
  venueId?: number;
  fieldId?: number;
  date?: string;
  status?: BookingStatus | "ALL";
  keyword?: string;
  page?: number;
  size?: number;
}

