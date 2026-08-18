import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// `role` can be a single role string ('ADMIN') or an array of allowed roles
// (['EMPLOYEE', 'HOD']) — used for pages shared between employees and HODs,
// like Apply Leave and Change Password.
export default function ProtectedRoute({ role, children }) {
  const { session, loading } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];

  // Session lives in persistent native storage (see AuthContext) and is read
  // asynchronously on app start. Until that read finishes, we don't yet know
  // whether the person is logged in — render nothing rather than bouncing a
  // genuinely logged-in user to the login screen for a flash.
  if (loading) return null;

  if (!session || !allowed.includes(session.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
