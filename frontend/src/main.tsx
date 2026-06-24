
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router/dom";
import router from "./router.tsx";
import { AuthProvider } from './context/AuthContext.tsx';


createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <RouterProvider router={router} />  
   </AuthProvider>
    
);
