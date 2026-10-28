export interface PriceRuleResponse {
  id: number;
  fieldId: number;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  active: boolean;
  createdAt: string;
}

export interface PriceRuleRequest {
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  active: boolean;
}