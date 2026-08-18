import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import ApplyLeave from './pages/ApplyLeave.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import HodDashboard from './pages/HodDashboard.jsx';
import MdDashboard from './pages/MdDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminResetPassword from './pages/AdminResetPassword.jsx';
import AdminManageMd from './pages/AdminManageMd.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { initPushNotifications } from './services/push.js';

export default function App() {
  const { session, loading } = useAuth();

  // Push notifications are only for EMPLOYEE and HOD — never ADMIN. This
  // runs on login and also on app reopen (session restored from persistent
  // storage), so an already-logged-in device stays registered.
  useEffect(() => {
    if (loading || !session) return;
    if (session.role === 'EMPLOYEE' || session.role === 'HOD' || session.role === 'MD') {
      initPushNotifications();
    }
  }, [loading, session]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute role="EMPLOYEE"><EmployeeDashboard /></ProtectedRoute>
      } />

      {/* Apply Leave is shared: an HOD is just an employee with the HOD flag
          set, and an MD is just an employee marked as MD (see
          backend/db/mdUsers.js) — both can apply for their own leave the
          same way an employee does. */}
      <Route path="/apply-leave" element={
        <ProtectedRoute role={['EMPLOYEE', 'HOD', 'MD']}><ApplyLeave /></ProtectedRoute>
      } />
      <Route path="/change-password" element={
        <ProtectedRoute role={['EMPLOYEE', 'HOD', 'MD']}><ChangePassword /></ProtectedRoute>
      } />

      <Route path="/hod" element={
        <ProtectedRoute role="HOD"><HodDashboard /></ProtectedRoute>
      } />
      <Route path="/hod/change-password" element={
        <ProtectedRoute role="HOD"><ChangePassword /></ProtectedRoute>
      } />

      <Route path="/md" element={
        <ProtectedRoute role="MD"><MdDashboard /></ProtectedRoute>
      } />
      <Route path="/md/change-password" element={
        <ProtectedRoute role="MD"><ChangePassword /></ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/reset-password" element={
        <ProtectedRoute role="ADMIN"><AdminResetPassword /></ProtectedRoute>
      } />
      <Route path="/admin/manage-md" element={
        <ProtectedRoute role="ADMIN"><AdminManageMd /></ProtectedRoute>
      } />

      <Route path="*" element={<Login />} />
    </Routes>
  );
}
