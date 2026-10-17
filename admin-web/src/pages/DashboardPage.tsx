import { useAuth } from "../auth/authContext";

// Trang tạm; các bài sau sẽ thêm quản lý địa điểm và sân
export function DashboardPage() {
  const { session } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tổng quan</h1>
      <p className="mt-2 text-gray-600">
        Xin chào, {session?.fullName}. Các chức năng quản lý sẽ được thêm ở các
        bài tiếp theo.
      </p>
    </div>
  );
}
