import type { AuthResponse, UserSession } from "../types/auth";

const STORAGE_KEY = "court_admin_session";

export function saveSession(auth: AuthResponse): UserSession {
  const session: UserSession = {
    accessToken: auth.accessToken,
    userId: auth.userId,
    fullName: auth.fullName,
    role: auth.role,
    expiresAt: Date.now() + auth.expiresInSeconds * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

// Trả về null nếu chưa đăng nhập, dữ liệu hỏng hoặc token đã hết hạn
export function getSession(): UserSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const session = JSON.parse(raw) as UserSession;
    if (!session.accessToken || Date.now() >= session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
