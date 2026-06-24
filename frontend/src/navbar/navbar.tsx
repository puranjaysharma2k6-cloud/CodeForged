import React from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext.tsx';
import './navbar.css';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", end: true },
  { to: "/contests", label: "Contests" },
  { to: "/announcements", label: "Announcements" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/help", label: "Help" },
];

interface NavLinkItemProps {
  item: NavItem;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ item }) => {
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
        }
      >
        {item.label}
      </NavLink>
    </li>
  );
};

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();   // read global auth state
  const navigate = useNavigate();

  function handleLogout() {
    logout();             // clears token from localStorage + state
    navigate("/");        // send them home
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-row">

          <div className="navbar-left">
            <NavLink to="/" className="navbar-brand">MyApp</NavLink>
            <div className="nav-menu">
              <ul className="nav-list">
                {MAIN_NAV_ITEMS.map((item) => (
                  <NavLinkItem key={item.to} item={item} />
                ))}
              </ul>
            </div>
          </div>

          <div className="auth-menu">
            {isAuthenticated ? (
              // --- LOGGED IN VIEW ---
              <ul className="auth-list">
                <li>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `auth-link-login ${isActive ? 'nav-link-active' : ''}`
                    }
                  >
                    Profile
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="auth-link-logout"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            ) : (
              // --- LOGGED OUT VIEW ---
              <ul className="auth-list">
                <li>
                  <NavLink
                    to="/auth/login"
                    className={({ isActive }) =>
                      `auth-link-login ${isActive ? 'nav-link-active' : ''}`
                    }
                  >
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/auth/register" className="auth-link-register">
                    Register
                  </NavLink>
                </li>
              </ul>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}