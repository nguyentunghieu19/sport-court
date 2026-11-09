import { useEffect, useState } from "react";

async function copyBookingCode(code: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(code);
      return;
    } catch {
      // Thử cách sao chép tương thích khi Clipboard API không khả dụng.
    }
  }

  const previousFocus = document.activeElement;
  const field = document.createElement("textarea");
  field.value = code;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  try {
    field.focus({ preventScroll: true });
    field.select();
    if (!document.execCommand("copy")) {
      throw new Error("Không sao chép được mã đơn");
    }
  } finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
    }
  }
}

export function CopyBookingCodeButton({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    try {
      await copyBookingCode(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  const label = status === "copied" ? "Đã sao chép" : status === "failed" ? "Thử lại" : "Sao chép";

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`${label} · Mã đơn ${code}`}
        title={status === "failed" ? "Không sao chép được mã đơn" : "Sao chép mã đơn"}
        className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
          status === "copied"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : status === "failed"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        }`}
      >
        <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {status === "copied" ? (
            <path d="m5 12 4 4L19 6" />
          ) : (
            <>
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M16 4H6a2 2 0 0 0-2 2v10" />
            </>
          )}
        </svg>
        {label}
      </button>
      <span role="status" className="sr-only">
        {status === "copied" && `Đã sao chép mã đơn ${code}`}
        {status === "failed" && "Không sao chép được mã đơn. Hãy thử lại."}
      </span>
    </>
  );
}
