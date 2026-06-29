import { Outlet, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext'; // Adjust path to your useAuth context
import Navbar from '../navbar/navbar';
export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
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