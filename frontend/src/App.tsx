// frontend/src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './routes/AppLayout';

// Public Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Authenticated Pages
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';

// Admin, Super Admin & Supervisor Pages
import AdminDashboard from './pages/AdminDashboard';
import ManageLeaves from './pages/ManageLeaves';
import ManageHolidays from './pages/ManageHolidays';
import UserLeaveReport from './pages/UserLeaveReport';
import AdminUserLeaves from './pages/AdminUserLeaves';
// UsersHub is no longer needed
import UserManagementTable from './pages/UserManagementTable';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

        {/* User Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/apply" element={<ApplyLeave />} />
        <Route path="/leaves" element={<MyLeaves />} />

        {/* Manager-level Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['supervisor', 'admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/leaves" element={<ProtectedRoute roles={['supervisor', 'admin']}><ManageLeaves /></ProtectedRoute>} />

        {/* Admin & Superadmin-only Routes */}
        <Route path="/admin/holidays" element={<ProtectedRoute roles={['admin']}><ManageHolidays /></ProtectedRoute>} />

        {/* --- THIS IS THE CHANGE --- */}
        {/* The old "/admin/users" route has been removed. */}
        {/* This is now the single, definitive route for user management. */}
        <Route path="/admin/users/table" element={<ProtectedRoute roles={['admin']}><UserManagementTable /></ProtectedRoute>} />

        <Route path="/admin/user-report" element={<ProtectedRoute roles={['admin']}><UserLeaveReport /></ProtectedRoute>} />
        <Route path="/admin/user-leaves/:userId" element={<ProtectedRoute roles={['admin']}><AdminUserLeaves /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}