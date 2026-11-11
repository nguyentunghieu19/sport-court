import { useEffect, useId, useRef, useState } from "react";

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
  currentImageUrl?: string | null;
  removeCurrent?: boolean;
  onRemoveChange?: (remove: boolean) => void;
  disabled?: boolean;
  progress?: number | null;
}

function SelectedImagePreview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={image} alt="Ảnh địa điểm đã chọn, chưa lưu" className="h-full w-full object-cover" />;
}

export function VenueImagePicker({ file, onFileChange, currentImageUrl, removeCurrent = false, onRemoveChange, disabled = false, progress = null }: Props) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [brokenImage, setBrokenImage] = useState<string | null>(null);
  const imageUrl = removeCurrent ? null : currentImageUrl;

  return (
    <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5" aria-labelledby={`${id}-label`}>
      <div className="mb-3">
        <h3 id={`${id}-label`} className="text-sm font-bold text-gray-900">Ảnh đại diện địa điểm</h3>
        <p id={`${id}-hint`} className="mt-1 text-xs leading-relaxed text-gray-500">Chọn một ảnh tổng quan từ máy của bạn. JPG, PNG hoặc WebP, tối đa 5 MB. Có thể thêm ảnh sau.</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-emerald-200 bg-white sm:w-48">
          {file ? <SelectedImagePreview file={file} /> : imageUrl && brokenImage !== imageUrl ? (
            <img src={imageUrl} alt="Ảnh đại diện địa điểm hiện tại" onError={() => setBrokenImage(imageUrl)} className="h-full w-full object-cover" />
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">
              <svg className="mx-auto mb-2 h-8 w-8 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></svg>
              {imageUrl ? "Không tải được ảnh" : removeCurrent ? "Ảnh sẽ được xóa khi lưu" : "Chưa có ảnh địa điểm"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="mb-2 block text-xs font-semibold text-gray-700">{file || imageUrl ? "Chọn ảnh thay thế" : "Chọn ảnh từ máy"}</label>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            aria-invalid={!!error}
            className="block w-full min-w-0 text-xs text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-800 disabled:opacity-50"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              event.target.value = "";
              if (!selected) return;
              if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
                setError("Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
                return;
              }
              if (selected.size === 0 || selected.size > 5 * 1024 * 1024) {
                setError("Ảnh phải có dữ liệu và dung lượng không quá 5 MB.");
                return;
              }
              setError(null);
              setBrokenImage(null);
              onFileChange(selected);
              onRemoveChange?.(false);
            }}
          />
          {file && <p className="mt-2 truncate text-xs text-emerald-800" title={file.name}>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB · Chưa lưu</p>}
          {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
            {file && <button type="button" disabled={disabled} className="text-gray-600 underline underline-offset-4 disabled:opacity-50" onClick={() => { onFileChange(null); setError(null); }}>Bỏ ảnh đã chọn</button>}
            {currentImageUrl && onRemoveChange && !removeCurrent && <button type="button" disabled={disabled} className="text-red-600 underline underline-offset-4 disabled:opacity-50" onClick={() => { onFileChange(null); onRemoveChange(true); setError(null); }}>Xóa ảnh địa điểm</button>}
            {removeCurrent && onRemoveChange && <button type="button" disabled={disabled} className="text-emerald-700 underline underline-offset-4 disabled:opacity-50" onClick={() => onRemoveChange(false)}>Giữ ảnh hiện tại</button>}
          </div>
          {progress !== null && <div className="mt-3" role="status"><p className="mb-1 text-xs text-emerald-800">Đang tải ảnh lên, vui lòng chờ…</p><progress max={100} value={progress} aria-label="Tiến độ tải ảnh địa điểm" className="h-2 w-full accent-emerald-600" /></div>}
        </div>
      </div>
    </section>
  );
}
