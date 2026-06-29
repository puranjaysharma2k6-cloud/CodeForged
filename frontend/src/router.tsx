import { createBrowserRouter } from "react-router";

// Layouts
import ProtectedLayout from "./layouts/layout";
import PublicLayout from "./layouts/PublicLayout"; // <-- We will create this

// Pages
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import LandingPage from './Pages/Dashboard/home';
import ContestsPage from './Pages/Contests/Contest';
import ContestArena from "./Pages/ContestArena/ContestArena";
import Codeeditor from "./components/CodeEditor/codeeditor.tsx";
import Profile from "./Pages/Profile/Profile";
import LeaderboardPage from "./Pages/leaderboard/leaderboard";
import { contestsLoader } from "./Pages/Contests/Contests.loader.tsx";
import ContestLayout from "./layouts/ContestLayout.tsx";

const router = createBrowserRouter([

  {
    element: <PublicLayout />, 
    children: [
      { path: "/", element: <LandingPage /> },
      {
        path: "contests",
        children: [
          { index: true, element: <ContestsPage />, loader: contestsLoader },
          
        ]
      },
    ]
  },


  {
    path: "/auth",
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ]
  },

  {
    element: <ProtectedLayout />, 
    children: [
      { path: "contests/:contestId", element: <ContestArena />,
        children :[ ]
       },
     
      
      {
        path: "profile",
        children: [
          { index: true, element: <Profile /> },
          { path: ":id", element: <Profile /> },
        ]
      },
      { path: "leaderboard", element: <LeaderboardPage /> },
      
    ]
  },
  {
        path: "contests/:contestId",
        element: <ContestLayout />, // 
        children: [
          { index: true, element: <ContestArena /> },      // Full-screen no navbar
          { path: ":problemId", element: <Codeeditor /> }  // Full-screen 
        ]
      }
]);

export default router;