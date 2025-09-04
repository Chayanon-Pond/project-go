import React from "react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  to?: string; // fallback path
  label?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ to = "/", label = "Back", className = "" }) => {
  const navigate = useNavigate();
  const onClick = () => {
    // Try going back, fallback to provided route
    if (window.history.length > 1) navigate(-1);
    else navigate(to, { replace: true });
  };
  return (
    <button
      onClick={onClick}
      className={`btn btn-sm btn-ghost gap-2 ${className}`}
      aria-label="Go back"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10.53 19.28a.75.75 0 01-1.06 0l-7-7a.75.75 0 010-1.06l7-7a.75.75 0 111.06 1.06L4.81 10H21a.75.75 0 010 1.5H4.81l5.72 5.72a.75.75 0 010 1.06z" clipRule="evenodd" />
      </svg>
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
