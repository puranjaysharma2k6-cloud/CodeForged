import { Outlet } from "react-router-dom";
import Navbar from "../navbar/navbar";

function ProtectedLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
}

export default ProtectedLayout;