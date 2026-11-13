export const sportLabels: Record<string, string> = { FOOTBALL: "Bóng đá", BADMINTON: "Cầu lông", PICKLEBALL: "Pickleball", TENNIS: "Tennis", BASKETBALL: "Bóng rổ", VOLLEYBALL: "Bóng chuyền", TABLE_TENNIS: "Bóng bàn", OTHER: "Khác" };
export const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
export const shortTime = (time: string) => time.slice(0, 5);
export function vietnamDate(offset = 0) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const date = new Date(`${today}T12:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + offset);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
