export interface DailyRevenuePoint {
  date: string;
  dayOfWeek: string;
  revenue: number;
  bookingsCount: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  year: number;
  revenue: number;
  bookingsCount: number;
}

export interface SportStatPoint {
  sportType: string;
  sportLabel: string;
  fieldsCount: number;
  bookingsCount: number;
  revenue: number;
  percentage: number;
}

export interface HourStatPoint {
  timeSlot: string;
  bookingsCount: number;
  percentage: number;
}

export interface TopFieldPoint {
  fieldId: number;
  fieldName: string;
  venueName: string;
  sportType: string;
  bookingsCount: number;
  revenue: number;
}

export interface PaymentMethodStatPoint {
  method: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ManagerStatsResponse {
  // Quy mô sân bãi
  totalVenues: number;
  activeVenues: number;
  inactiveVenues: number;
  totalFields: number;
  activeFields: number;
  maintenanceFields: number;
  inactiveFields: number;

  // Đơn đặt sân
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  cancellationRate: number;

  // Doanh thu tài chính
  totalRevenue: number;
  totalDeposit: number;
  totalRefunded: number;
  netRevenue: number;
  avgOrderValue: number;

  // Chuỗi thời gian
  last7DaysRevenue: DailyRevenuePoint[];
  monthlyRevenue: MonthlyRevenuePoint[];

  // Cơ cấu & Phân tích
  sportBreakdown: SportStatPoint[];
  peakHoursBreakdown: HourStatPoint[];
  topFields: TopFieldPoint[];
  paymentMethodBreakdown: PaymentMethodStatPoint[];
}

