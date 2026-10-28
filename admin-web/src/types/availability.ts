export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  price: number;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "PAST" | string;
}

export interface FieldAvailabilityResponse {
  fieldId: number;
  fieldName: string;
  sportType: string;
  venueId: number;
  venueName: string;
  date: string;
  fieldStatus: string;
  bookable: boolean;
  slots: AvailabilitySlot[];
}