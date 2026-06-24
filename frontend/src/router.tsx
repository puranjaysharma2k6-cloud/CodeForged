import { createBrowserRouter } from "react-router"
import ProtectedLayout from "./layouts/layout"
// import {Login} from "./Pages"

import Login from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import ContestsPage from './Pages/Contests/Contest'
import { contestsLoader } from './Pages/Contests/Contests.loader'

const router = createBrowserRouter([
  { path: "/contests",  element: <ContestsPage />, loader: contestsLoader },
  {
    path: "/auth",
    children: [
      { path: "login",    element: <Login /> },
      { path: "register", element: <Register /> }
    ]
  },
  {
    path : "/profile",
    element: <ProtectedLayout />,   
    children: [
       //{ path: "/contests", element: <Contest /> },
       //{ path: "/profile",   element: <Profile /> },
    ]
  }
])

export default router