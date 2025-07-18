import React, { useState, useEffect } from "react";
import { IoMoon } from "react-icons/io5";
import { LuSun } from "react-icons/lu";

const NavBar: React.FC = () => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // โหลด theme จาก localStorage
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
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
            <span className="mr-4 font-semibold">Daily Tasks</span>
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
