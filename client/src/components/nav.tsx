import React, { useState, useEffect } from "react";
import { IoMoon } from "react-icons/io5";
import { LuSun } from "react-icons/lu";
import { useAuth } from "../hooks/useAuth";
import AuthModal from "./AuthModal";
import { Link } from "react-router-dom";

const NavBar: React.FC = () => {
  const [theme, setTheme] = useState("light");
  const { user, logout } = useAuth();
  const [openAuth, setOpenAuth] = useState(false);

  useEffect(() => {
    // โหลด theme จาก localStorage
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Allow other components to request opening the login modal
  useEffect(() => {
    const handler = () => setOpenAuth(true);
    window.addEventListener("open-login-modal", handler as EventListener);
    return () =>
      window.removeEventListener("open-login-modal", handler as EventListener);
  }, []);

  // Close auth modal after a successful login
  useEffect(() => {
    const handler = () => setOpenAuth(false);
    window.addEventListener("auth-updated", handler as EventListener);
    return () =>
      window.removeEventListener("auth-updated", handler as EventListener);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div>
      <div className="max-w-[900px] mx-auto">
        <div className="navbar bg-base-100 shadow-sm mb-4">
          {/* Left side - Brand */}
          <div className="flex-1">
            <Link to="/" className="btn btn-ghost text-xl" aria-label="Go home">
              <img src="/react.png" alt="logo" className="w-[50px] h-[50px]" />
              <span className="text-[40px]">+</span>
              <img src="/go.png" alt="logo" className="w-[50px] h-[50px]" />
              <span className="text-[40px]">=</span>
              <img
                src="/explode.png"
                alt="logo"
                className="w-[50px] h-[50px]"
              />
            </Link>
          </div>

          {/* Right side - Theme toggle */}
          <div className="flex-none">
            <span className="mr-4 font-semibold">Daily Tasks</span>
            {!user ? (
              <div className="inline-flex items-center gap-2 mr-2">
                <button
                  className="btn btn-sm"
                  onClick={() => setOpenAuth(true)}
                >
                  Login
                </button>
                <Link to="/signup" className="btn btn-sm">
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="dropdown dropdown-end mr-2 z-50">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-sm bg-base-300/60 flex items-center gap-2"
                >
                  <div className="avatar">
                    {user.avatar ? (
                      <div className="rounded-full w-6 h-6 overflow-hidden">
                        <img
                          src={user.avatar}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-6">
                          <span className="text-xs">
                            {(user.username || user.name)?.[0]?.toUpperCase() ||
                              "U"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold">
                    {user.username || user.name}
                  </span>
                  <svg
                    className="w-4 h-4 opacity-70"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-2"
                >
                  <li>
                    <Link to="/profile">Profile</Link>
                  </li>
                  <li>
                    <Link to="/wishlist">Wishlist</Link>
                  </li>
                  <li>
                    <button onClick={logout}>Logout</button>
                  </li>
                </ul>
              </div>
            )}
            <button
              className="btn btn-ghost btn-circle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <IoMoon className="w-5 h-5" />
              ) : (
                <LuSun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        {openAuth && <AuthModal onClose={() => setOpenAuth(false)} />}
      </div>
    </div>
  );
};

export default NavBar;
