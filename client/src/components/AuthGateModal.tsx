import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  onClose: () => void;
  onLoginClick: () => void;
}

const AuthGateModal: React.FC<Props> = ({ onClose, onLoginClick }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-base-100 text-base-content w-full max-w-md rounded-2xl shadow-xl border border-slate-600/30 p-6">
        <button className="absolute right-3 top-3 btn btn-xs" onClick={onClose}>
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">Create an account to continue</h3>
          <p className="text-sm opacity-80 mb-6 max-w-sm">
            Sign up to save your tasks and access them across devices. It only takes a moment.
          </p>

          <button
            className="btn btn-primary w-full mb-3"
            onClick={() => {
              onClose();
              navigate("/signup");
            }}
          >
            Create account
          </button>

          <div className="text-sm">
            Already have an account?{" "}
            <button className="link" onClick={() => { onClose(); onLoginClick(); }}>
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGateModal;
