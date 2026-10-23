import { Navigate, Route, Routes } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VenuesPage } from "./pages/VenuesPage";
import { VenueEditPage } from "./pages/VenueEditPage";
import { FieldEditPage } from "./pages/FieldEditPage";

function App() {
  return (
    <Routes>
      {/* Route công khai */}
      <Route path="/login" element={<LoginPage />} />

      {/* Tuyến đường được bảo vệ qua khối RequireAuth */}
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="venues" element={<VenuesPage />} />
          <Route path="venues/:id" element={<VenueEditPage />} />
          <Route path="venues/:id/edit" element={<VenueEditPage />} />
          <Route path="venues/:venueId/fields/new" element={<FieldEditPage />} />
          <Route path="venues/:venueId/fields/:fieldId/edit" element={<FieldEditPage />} />
        </Route>
      </Route>

      {/* Điều hướng mặc định */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
