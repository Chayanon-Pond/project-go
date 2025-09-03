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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
          : raw);
      setError(finalMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 text-base-content rounded-xl p-6 w-full max-w-md border border-slate-600/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Sign in</h3>
          <button onClick={onClose} className="btn btn-sm">x</button>
        </div>
        {error && <div className="alert alert-error mb-3">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input className="input input-bordered w-full" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          <input className="input input-bordered w-full" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6} />
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        </form>
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
