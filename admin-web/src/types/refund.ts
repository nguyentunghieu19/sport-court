export type RefundStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "REJECTED";

export interface ManagerRefundResponse {
  id: number;
  paymentId: number;
  paymentType: string;
  paymentMethod: string;
  bookingId: number;
  bookingCode: string;
  venueId: number;
  venueName: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  referenceNote: string | null;
  requestedAt: string;
  requestedByName: string | null;
  processedAt: string | null;
  completedAt: string | null;
  processedByName: string | null;
}

export interface ConfirmRefundRequest {
  note: string;
}

export interface RefundFilterParams {
  venueId?: number;
  status?: RefundStatus | "ALL";
  page?: number;
  size?: number;
}

