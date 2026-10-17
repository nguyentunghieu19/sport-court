// Khớp ErrorResponse của backend
export interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
