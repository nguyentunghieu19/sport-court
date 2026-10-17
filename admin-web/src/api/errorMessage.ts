import axios from "axios";
import type { ApiErrorBody } from "../types/api";

// Đổi mọi loại lỗi thành một câu thông báo tiếng Việt cho người dùng
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response) {
      return (
        error.response.data?.message ??
        `Lỗi ${error.response.status}, vui lòng thử lại`
      );
    }
    return "Không kết nối được máy chủ. Hãy kiểm tra mạng và backend";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Đã xảy ra lỗi không xác định";
}
