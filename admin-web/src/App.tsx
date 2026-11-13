import { Navigate, Route, Routes } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireOwner } from "./auth/RequireOwner";
import { RequireOperations, RequireSystemAdmin } from "./auth/RequireSystemAdmin";
import { AdminLayout } from "./layouts/AdminLayout";
import { SystemAdminLayout } from "./layouts/SystemAdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OwnerRegisterPage, RegisterPage } from "./pages/OwnerRegisterPage";
import { RequireCustomer } from "./auth/RequireCustomer";
import { CustomerLayout } from "./layouts/CustomerLayout";
import { CustomerHomePage } from "./pages/customer/CustomerHomePage";
import { CustomerVenuePage } from "./pages/customer/CustomerVenuePage";
import { CustomerAvailabilityPage } from "./pages/customer/CustomerAvailabilityPage";
import { CustomerBookingConfirmPage } from "./pages/customer/CustomerBookingConfirmPage";
import { CustomerBookingsPage } from "./pages/customer/CustomerBookingsPage";
import { CustomerBookingDetailPage } from "./pages/customer/CustomerBookingDetailPage";
import { CustomerPaymentsPage } from "./pages/customer/CustomerPaymentsPage";
import { CustomerProfilePage } from "./pages/customer/CustomerProfilePage";
import { CustomerNotificationsPage } from "./pages/customer/CustomerNotificationsPage";
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
import { SystemOverviewPage } from "./pages/system-admin/SystemOverviewPage";
import { AdminAccountsPage } from "./pages/system-admin/AdminAccountsPage";
import { AdminVenueDetailPage, AdminVenuesPage } from "./pages/system-admin/AdminVenuesPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-owner" element={<OwnerRegisterPage />} />

      <Route element={<CustomerLayout />}>
        <Route index element={<CustomerHomePage />} />
        <Route path="locations/:id" element={<CustomerVenuePage />} />
        <Route path="fields/:fieldId" element={<CustomerAvailabilityPage />} />
        <Route element={<RequireCustomer />}>
          <Route path="fields/:fieldId/book" element={<CustomerBookingConfirmPage />} />
          <Route path="my-bookings" element={<CustomerBookingsPage />} />
          <Route path="my-bookings/:id" element={<CustomerBookingDetailPage />} />
          <Route path="my-payments" element={<CustomerPaymentsPage />} />
          <Route path="account" element={<CustomerProfilePage />} />
          <Route path="notifications" element={<CustomerNotificationsPage />} />
        </Route>
      </Route>

      <Route element={<RequireSystemAdmin />}>
        <Route path="admin" element={<SystemAdminLayout />}>
          <Route index element={<SystemOverviewPage />} />
          <Route path="accounts" element={<AdminAccountsPage />} />
          <Route path="venues" element={<AdminVenuesPage />} />
          <Route path="venues/:id" element={<AdminVenueDetailPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<RequireOperations />}>
          <Route element={<AdminLayout />}>
            <Route path="manage" element={<DashboardPage />} />
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
