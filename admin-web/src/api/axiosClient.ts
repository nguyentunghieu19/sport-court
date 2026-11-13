import axios from "axios";
import { clearSession, getSession } from "../auth/sessionStore";
import { safeReturnTo } from "../auth/authNavigation";

const baseURL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Tự gắn token vào mọi yêu cầu nếu đang đăng nhập
apiClient.interceptors.request.use((config) => {
  const session = getSession();
  if (session) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Token hết hạn hoặc không hợp lệ (401) khi đang có phiên: xóa phiên và về trang đăng nhập
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      getSession()
    ) {
      const previous = getSession();
      clearSession();
      const params = new URLSearchParams({ mode: previous?.role === "USER" ? "customer" : "management" });
      const returnTo = safeReturnTo(window.location.pathname + window.location.search);
      if (previous?.role === "USER" && returnTo) params.set("returnTo", returnTo);
      window.location.assign(`/login?${params}`);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
