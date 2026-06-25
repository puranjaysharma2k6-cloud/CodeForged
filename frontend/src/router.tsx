import { createBrowserRouter } from "react-router"
import ProtectedLayout from "./layouts/layout"
// import {Login} from "./Pages"

import Login from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import ContestsPage from './Pages/Contests/Contest'
import { contestsLoader } from './Pages/Contests/Contests.loader'
import { profileLoader } from "./Pages/Profile/profile.loader"
import Profile from "./Pages/Profile/Profile"
import LandingPage from "./Pages/Dashboard/home"
import LeaderboardPage from "./Pages/leaderboard/leaderboard"
const router = createBrowserRouter([
  
  {
    path : "/",
    element: <ProtectedLayout />,   
    children: [
      { path: "/",         element: <LandingPage /> },
       { path: "/contests", element: <ContestsPage />, loader: contestsLoader },
       { path: "/profile",   element: <Profile />,loader : profileLoader },
       {
    path: "/auth",
    children: [
      { path: "login",    element: <Login /> },
      { path: "register", element: <Register /> },
    ]
  },
   {
    path: "/leaderboard",
    element : <LeaderboardPage/>,
    loader : profileLoader, // this is just an auth check no data is loaded 
  },
      { path: "profile/:id",    element: <Profile /> },  
    ]
  }
])

export default router