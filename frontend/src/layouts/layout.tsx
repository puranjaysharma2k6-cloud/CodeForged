import { Outlet, Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../navbar/navbar';

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Contest editor is a full-screen IDE — no navbar, no wrapper padding
  const isFullScreen = /^\/contests\/[^/]+\/[^/]+/.test(location.pathname);

  if (isFullScreen) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}