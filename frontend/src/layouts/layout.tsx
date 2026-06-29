import { Outlet, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext'; // Adjust path to your useAuth context

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="app-layout min-h-screen bg-[#0f1117] text-white">

      <nav className="border-b border-[#363c4a] bg-[#1a1d24] px-6 py-4">
        <span className="font-bold text-[#22d3ee]">App Shell Header</span>
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}