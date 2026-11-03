export interface PolicyResponse {
  depositPercentage: number;
  cancellationDeadlineHours: number;
  depositRefundableOnCustomerCancel: boolean;
  fullPaymentRefundableBeforeDeadline: boolean;
  ownerCancellationFullRefund: boolean;
  paymentTimeoutMinutes: number;
}

export interface PolicyRequest {
  depositPercentage: number;
  cancellationDeadlineHours: number;
  depositRefundableOnCustomerCancel: boolean;
  fullPaymentRefundableBeforeDeadline: boolean;
  ownerCancellationFullRefund: boolean;
  paymentTimeoutMinutes: number;
}

