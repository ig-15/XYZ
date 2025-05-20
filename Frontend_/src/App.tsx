import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, RequireAuth } from '@/context/AuthContext';

// Public Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import ParkingSpaces from "./pages/admin/ParkingSpaces";
import UsersManagement from "./pages/admin/Users";
import AdminCars from "./pages/admin/Cars";
import AdminTickets from "./pages/admin/Tickets";
import AdminReports from "./pages/admin/Reports";

// Attendant Pages
import AttendantDashboard from "./pages/attendant/Dashboard";
import RegisterEntryExit from "./pages/attendant/Register";
import ParkingStatus from "./pages/attendant/Status";

// User Pages
import UserDashboard from "./pages/user/Dashboard";
import BookParking from "./pages/user/Book";
import UserCars from "./pages/user/Cars";
import UserBookings from "./pages/user/Bookings";
import UserHistory from "./pages/user/History";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/parking-spaces"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <ParkingSpaces />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <UsersManagement />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/cars"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <AdminCars />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/tickets"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <AdminTickets />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RequireAuth allowedRoles={['admin']}>
                  <AdminReports />
                </RequireAuth>
              }
            />
            
            {/* Attendant Routes */}
            <Route
              path="/attendant/dashboard"
              element={
                <RequireAuth allowedRoles={['attendant']}>
                  <AttendantDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/attendant/register"
              element={
                <RequireAuth allowedRoles={['attendant']}>
                  <RegisterEntryExit />
                </RequireAuth>
              }
            />
            <Route
              path="/attendant/status"
              element={
                <RequireAuth allowedRoles={['attendant']}>
                  <ParkingStatus />
                </RequireAuth>
              }
            />
            
            {/* User Routes */}
            <Route
              path="/user/dashboard"
              element={
                <RequireAuth allowedRoles={['user']}>
                  <UserDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/user/book"
              element={
                <RequireAuth allowedRoles={['user']}>
                  <BookParking />
                </RequireAuth>
              }
            />
            <Route
              path="/user/cars"
              element={
                <RequireAuth allowedRoles={['user']}>
                  <UserCars />
                </RequireAuth>
              }
            />
            <Route
              path="/user/bookings"
              element={
                <RequireAuth allowedRoles={['user']}>
                  <UserBookings />
                </RequireAuth>
              }
            />
            <Route
              path="/user/history"
              element={
                <RequireAuth allowedRoles={['user']}>
                  <UserHistory />
                </RequireAuth>
              }
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;