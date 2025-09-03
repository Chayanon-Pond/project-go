import React, { useState } from "react";
import { BASE_URL } from "../App";
// import { useAuth } from "../hooks/useAuth";
// import type { AuthResponse } from "../types/Auth";
import NavBar from "../components/nav";
import { useNavigate } from "react-router-dom";

const SignUpPage: React.FC = () => {
  // const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const validate = () => {
    const nErr = name.trim().length < 2 ? "Name must be at least 2 characters" : null;
    const eErr = !email.trim() ? "Email is required" : (!emailRegex.test(email) ? "Enter a valid email" : null);
    const pErr = password.length < 6 ? "Password must be at least 6 characters" : null;
    setNameError(nErr); setEmailError(eErr); setPasswordError(pErr);
    return !(nErr || eErr || pErr);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

  if (!validate()) return;

    setLoading(true);
    try {
      const primaryUrl = `${BASE_URL}/auth/register`;
      const localUrl = `http://localhost:4000/api/auth/register`;
      const canTryLocal = (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) || import.meta.env.MODE !== "production";
      const res = await fetch(primaryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : await res.text();
      // let ar: AuthResponse;
      if (!res.ok) {
        // Fallback to local dev API if the primary host doesn't have the route
        if ((res.status === 404 || (typeof payload === "string" && payload.startsWith("Cannot "))) && canTryLocal) {
          const res2 = await fetch(localUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const ct2 = res2.headers.get("content-type") || "";
          const payload2 = ct2.includes("application/json") ? await res2.json() : await res2.text();
          if (!res2.ok) {
            const msg2 = typeof payload2 === "string" ? payload2 : (payload2?.error || "Sign up failed");
            throw new Error(msg2);
          }
          // success on local fallback
        } else {
          const msg = typeof payload === "string" ? payload : (payload?.error || "Sign up failed");
          throw new Error(msg);
        }
      } else {
        // success on primary URL
      }
      // Do not auto-login; prompt user to sign in instead
      setSuccess("Account created. Please sign in.");
      // Open login modal and navigate home
      window.dispatchEvent(new CustomEvent("open-login-modal"));
      navigate("/", { replace: true });
    } catch (e: any) {
      // Improve common 404 and network cases
      const raw = e?.message || "Sign up failed";
      const finalMsg = raw.includes("Failed to fetch") || raw.includes("ERR_CONNECTION_REFUSED")
        ? "Network error connecting to the API. If you're on production, ensure VITE_API_URL points to a server with /api/auth/register."
        : (raw.startsWith("Cannot ") || raw.includes("404")
          ? `Register endpoint is not available on the server (${BASE_URL}/auth/register). Configure VITE_API_URL to a backend that has /api/auth/*.`
          : raw);
      setError(finalMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-base-100 border border-slate-600/30 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-4">Sign up</h1>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <input
                className={`input input-bordered w-full ${nameError ? "input-error" : ""}`}
                placeholder="Name"
                value={name}
                onChange={(e)=>{ setName(e.target.value); setNameError(null); if (error) setError(null); }}
                onBlur={() => setNameError(name.trim().length < 2 ? "Name must be at least 2 characters" : null)}
                required
              />
              {nameError && <p className="text-error text-xs mt-1">{nameError}</p>}
            </div>
            <div>
              <input
                className={`input input-bordered w-full ${emailError ? "input-error" : ""}`}
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e)=>{ setEmail(e.target.value); setEmailError(null); if (error) setError(null); }}
                onBlur={() => setEmailError(!email.trim() ? "Email is required" : (!emailRegex.test(email) ? "Enter a valid email" : null))}
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
                onChange={(e)=>{ setPassword(e.target.value); setPasswordError(null); if (error) setError(null); }}
                onBlur={() => setPasswordError(password.length < 6 ? "Password must be at least 6 characters" : null)}
                required
                minLength={6}
              />
              {passwordError && <p className="text-error text-xs mt-1">{passwordError}</p>}
            </div>
            <button className="btn btn-primary w-full" disabled={loading || !!nameError || !!emailError || !!passwordError}>
              {loading ? "Submitting..." : "Create account"}
            </button>
          </form>
          {error && <div className="alert alert-error mt-3">{error}</div>}
          {success && <div className="alert alert-success mt-3">{success}</div>}
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
