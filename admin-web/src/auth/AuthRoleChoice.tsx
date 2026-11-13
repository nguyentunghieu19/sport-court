import type { LoginMode } from "../types/auth";

export function AuthRoleChoice({ mode, onChange, disabled = false }: {
  mode: LoginMode;
  onChange: (mode: LoginMode) => void;
  disabled?: boolean;
}) {
  return <div className="sc-auth-roles" role="group" aria-label="Chọn loại tài khoản">
    <button type="button" disabled={disabled} aria-pressed={mode === "customer"} onClick={() => onChange("customer")}>Người dùng</button>
    <button type="button" disabled={disabled} aria-pressed={mode === "management"} onClick={() => onChange("management")}>Chủ sân / Admin / Nhân viên</button>
  </div>;
}
