import React, { useState } from "react";
import { IoMoon } from "react-icons/io5";
import { LuSun } from "react-icons/lu";

const NavBar: React.FC = () => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div>
      <div className="max-w-[900px] mx-auto">
        <div className="navbar bg-base-100 shadow-sm mb-4">
          {/* Left side - Brand */}
          <div className="flex-1">
            <a className="btn btn-ghost text-xl">
              <img src="/react.png" alt="logo" className="w-[50px] h-[50px]" />
              <span className="text-[40px]">+</span>
              <img src="/go.png" alt="logo" className="w-[50px] h-[50px]" />
              <span className="text-[40px]">=</span>
              <img
                src="/explode.png"
                alt="logo"
                className="w-[50px] h-[50px]"
              />
            </a>
          </div>

          {/* Right side - Theme toggle */}
          <div className="flex-none">
            <span>Daily Tasks</span>
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
      </div>
    </div>
  );
};

export default NavBar;
