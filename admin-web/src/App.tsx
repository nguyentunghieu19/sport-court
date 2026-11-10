import { Navigate, Route, Routes } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireOwner } from "./auth/RequireOwner";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OwnerRegisterPage } from "./pages/OwnerRegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VenuesPage } from "./pages/VenuesPage";
import { VenueEditPage } from "./pages/VenueEditPage";
import { FieldEditPage } from "./pages/FieldEditPage";
import { FieldPriceRulesPage } from "./pages/FieldPriceRulesPage";
import { FieldAvailabilityPage } from "./pages/FieldAvailabilityPage";
import { BookingsPage } from "./pages/BookingsPage";
import { BookingDetailPage } from "./pages/BookingDetailPage";
import { RefundsPage } from "./pages/RefundsPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { StaffPage } from "./pages/StaffPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-owner" element={<OwnerRegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          {/* Các trang dành riêng cho OWNER */}
          <Route element={<RequireOwner />}>
            <Route path="venues" element={<VenuesPage />} />
            <Route path="venues/:id" element={<VenueEditPage />} />
            <Route path="venues/:id/edit" element={<VenueEditPage />} />
            <Route path="venues/:venueId/fields/new" element={<FieldEditPage />} />
            <Route
              path="venues/:venueId/fields/:fieldId/edit"
              element={<FieldEditPage />}
            />
            <Route
              path="venues/:venueId/fields/:fieldId/price-rules"
              element={<FieldPriceRulesPage />}
            />
            <Route
              path="venues/:venueId/fields/:fieldId/availability"
              element={<FieldAvailabilityPage />}
            />
            <Route path="staff" element={<StaffPage />} />
          </Route>
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="refunds" element={<RefundsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
