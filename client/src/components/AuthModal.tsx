import React, { useState } from "react";
import { BASE_URL } from "../App";
import { useAuth } from "../hooks/useAuth";
import type { AuthResponse } from "../types/Auth";
import { useNavigate } from "react-router-dom";

interface Props {
  onClose: () => void;
}

const AuthModal: React.FC<Props> = ({ onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const validateEmail = (v: string) => {
    if (!v.trim()) return "Email is required";
    if (!emailRegex.test(v)) return "Enter a valid email";
    return null;
  };
  const validatePassword = (v: string) => {
    if (!v) return "Password is required";
    if (v.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // client-side validation
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) {
      setLoading(false);
      return;
    }
    try {
      const url = `${BASE_URL}/auth/login`;
      const localUrl = `http://localhost:4000/api/auth/login`;
      const canTryLocal = (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) || import.meta.env.MODE !== "production";
      const body: any = { email, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : await res.text();
      let ar: AuthResponse;
      if (!res.ok) {
        if ((res.status === 404 || (typeof payload === "string" && payload.startsWith("Cannot "))) && canTryLocal) {
          const res2 = await fetch(localUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const ct2 = res2.headers.get("content-type") || "";
          const payload2 = ct2.includes("application/json") ? await res2.json() : await res2.text();
          if (!res2.ok) {
            const msg2 = typeof payload2 === "string" ? payload2 : (payload2 as any)?.error || "Sign in failed";
            throw new Error(msg2);
          }
          ar = payload2 as AuthResponse;
        } else {
          const msg = typeof payload === "string" ? payload : (payload as any)?.error || `Auth API not available at ${url}`;
          throw new Error(msg);
        }
      } else {
        ar = payload as AuthResponse;
      }
      login(ar.token, ar.user);
      onClose();
    } catch (e: any) {
      const raw = e?.message || "Sign in failed";
      const finalMsg = raw.includes("Failed to fetch") || raw.includes("ERR_CONNECTION_REFUSED")
        ? "Network error connecting to the API. If you're on production, ensure VITE_API_URL points to a server with /api/auth/login."
        : (raw.startsWith("Cannot ") || raw.includes("404")
          ? `Login endpoint is not available on the server (${BASE_URL}/auth/login). Configure VITE_API_URL to a backend that has /api/auth/*.`
          : (raw.includes("Invalid credentials") || raw.includes("401")
            ? "Invalid email or password"
            : raw));
      if (finalMsg === "Invalid email or password") {
        setEmailError("Check your email");
        setPasswordError("Check your password");
      }
      setError(finalMsg);
    } finally {
      setLoading(false);
    }
  };

  // Demo login helper previously existed; replaced by static demo credentials text below

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 text-base-content rounded-xl p-6 w-full max-w-md border border-slate-600/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Sign in</h3>
          <button onClick={onClose} className="btn btn-sm">x</button>
        </div>
        {error && <div className="alert alert-error mb-3">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <input
              className={`input input-bordered w-full ${emailError ? "input-error" : ""}`}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e)=>{ setEmail(e.target.value); if (error) setError(null); setEmailError(null); }}
              onBlur={() => setEmailError(validateEmail(email))}
              required
            />
            {emailError && <p className="text-error text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <input
              className={`input input-bordered w-full ${passwordError ? "input-error" : ""}`}
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e)=>{ setPassword(e.target.value); if (error) setError(null); setPasswordError(null); }}
              onBlur={() => setPasswordError(validatePassword(password))}
              required
              minLength={6}
            />
            {passwordError && <p className="text-error text-xs mt-1">{passwordError}</p>}
          </div>
          <button className="btn btn-primary w-full" disabled={loading || !!emailError || !!passwordError}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-3 text-sm opacity-80">
          Demo user: <span className="font-semibold">cerepe3206@neuraxo.com</span> &nbsp; password: <span className="font-semibold">ppond333</span>
        </div>
        <div className="mt-4 text-sm flex items-center justify-between">
          <span className="opacity-80">Don’t have an account?</span>
          <button
            className="btn btn-sm"
            onClick={() => { onClose(); navigate("/signup"); }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
