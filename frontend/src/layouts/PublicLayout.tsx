import { Outlet } from "react-router";
import Navbar from "../navbar/navbar"; // Adjust path if needed

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <Navbar />

      
      <main>
        <Outlet />
      </main>
    </div>
  );
}