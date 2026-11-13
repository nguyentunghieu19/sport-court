export interface CustomerPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CustomerBooking {
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
  status: string;
  customerNote: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
}

export interface CustomerCancellationPreview {
  bookingId: number;
  bookingCode: string;
  status: string;
  canCancel: boolean;
  cancelDeadlineAt: string | null;
  paidAmount: number;
  refundAmount: number;
  forfeitedAmount: number;
  message: string;
}

export interface CustomerPayment {
  id: number;
  bookingId: number;
  bookingCode: string;
  bookingStatus: string;
  paymentType: string;
  method: string;
  provider: string | null;
  providerTransactionId: string | null;
  amount: number;
  status: string;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface CustomerPaymentLink {
  paymentId: number;
  bookingId: number;
  bookingCode: string;
  paymentType: string;
  amount: number;
  paymentUrl: string;
  expiresAt: string;
}

export interface CustomerRefund {
  id: number;
  bookingId: number;
  bookingCode: string;
  amount: number;
  reason: string | null;
  status: string;
  requestedAt: string;
  completedAt: string | null;
}
